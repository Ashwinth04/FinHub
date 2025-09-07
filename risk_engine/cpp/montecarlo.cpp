#include "montecarlo.h"
#include <algorithm>
#include <cmath>
#include <omp.h>
#include <stdexcept>
#include <iostream>

MonteCarloRiskEngine::MonteCarloRiskEngine(const std::vector<PortfolioAsset>& assets,
                                         const std::vector<std::vector<double>>& corr_matrix,
                                         int simulations,
                                         double horizon) 
    : portfolio(assets), correlation_matrix(corr_matrix), 
      num_simulations(simulations), time_horizon(horizon) {
    
    // Validate inputs
    if (portfolio.empty()) {
        throw std::invalid_argument("Portfolio cannot be empty");
    }
    
    if (correlation_matrix.size() != portfolio.size() || 
        correlation_matrix[0].size() != portfolio.size()) {
        throw std::invalid_argument("Correlation matrix dimensions must match portfolio size");
    }
    
    // Validate correlation matrix is symmetric and positive definite (basic check)
    for (size_t i = 0; i < correlation_matrix.size(); ++i) {
        for (size_t j = 0; j < correlation_matrix[i].size(); ++j) {
            if (std::abs(correlation_matrix[i][j] - correlation_matrix[j][i]) > 1e-10) {
                throw std::invalid_argument("Correlation matrix must be symmetric");
            }
        }
        if (correlation_matrix[i][i] < 0.99 || correlation_matrix[i][i] > 1.01) {
            throw std::invalid_argument("Diagonal elements of correlation matrix should be 1");
        }
    }
}

std::vector<std::vector<double>> MonteCarloRiskEngine::choleskyDecomposition(
    const std::vector<std::vector<double>>& matrix) {
    
    size_t n = matrix.size();
    std::vector<std::vector<double>> L(n, std::vector<double>(n, 0.0));
    
    for (size_t i = 0; i < n; ++i) {
        for (size_t j = 0; j <= i; ++j) {
            if (j == i) {
                double sum = 0.0;
                for (size_t k = 0; k < j; ++k) {
                    sum += L[j][k] * L[j][k];
                }
                L[j][j] = std::sqrt(matrix[j][j] - sum);
            } else {
                double sum = 0.0;
                for (size_t k = 0; k < j; ++k) {
                    sum += L[i][k] * L[j][k];
                }
                L[i][j] = (matrix[i][j] - sum) / L[j][j];
            }
        }
    }
    return L;
}

std::vector<double> MonteCarloRiskEngine::generateCorrelatedReturns(
    std::mt19937& gen, const std::vector<std::vector<double>>& cholesky) {
    
    std::normal_distribution<double> normal_dist(0.0, 1.0);
    size_t n = portfolio.size();
    
    // Generate independent normal random variables
    std::vector<double> independent(n);
    for (size_t i = 0; i < n; ++i) {
        independent[i] = normal_dist(gen);
    }
    
    // Transform to correlated returns
    std::vector<double> correlated_returns(n);
    for (size_t i = 0; i < n; ++i) {
        correlated_returns[i] = portfolio[i].expected_return * time_horizon;
        double volatility_component = 0.0;
        for (size_t j = 0; j <= i; ++j) {
            volatility_component += cholesky[i][j] * independent[j];
        }
        correlated_returns[i] += portfolio[i].volatility * std::sqrt(time_horizon) * volatility_component;
    }
    
    return correlated_returns;
}

double MonteCarloRiskEngine::calculatePortfolioReturn(const std::vector<double>& asset_returns) {
    double portfolio_return = 0.0;
    for (size_t i = 0; i < portfolio.size(); ++i) {
        portfolio_return += portfolio[i].weight * asset_returns[i];
    }
    return portfolio_return;
}

double MonteCarloRiskEngine::calculateVaR(std::vector<double>& returns, double confidence_level) {
    if (returns.empty()) {
        throw std::invalid_argument("Returns vector cannot be empty");
    }
    
    std::sort(returns.begin(), returns.end());
    size_t index = static_cast<size_t>((1.0 - confidence_level) * returns.size());
    if (index >= returns.size()) {
        index = returns.size() - 1;
    }
    
    // VaR is the negative of the percentile (loss is positive)
    return -returns[index];
}

double MonteCarloRiskEngine::calculateCVaR(const std::vector<double>& returns, 
                                          double confidence_level, double var_value) {
    if (returns.empty()) {
        throw std::invalid_argument("Returns vector cannot be empty");
    }
    
    double sum = 0.0;
    int count = 0;
    
    for (double ret : returns) {
        if (-ret >= var_value) { // Loss greater than VaR
            sum += ret;
            count++;
        }
    }
    
    if (count == 0) {
        return var_value; // If no losses exceed VaR, CVaR equals VaR
    }
    
    return -(sum / count); // CVaR is negative of average of tail losses
}

RiskMetrics MonteCarloRiskEngine::runSimulation() {
    std::vector<double> portfolio_returns(num_simulations);
    
    // Cholesky decomposition for correlation
    auto cholesky = choleskyDecomposition(correlation_matrix);
    
    // Calculate expected portfolio return and volatility
    double expected_portfolio_return = 0.0;
    for (const auto& asset : portfolio) {
        expected_portfolio_return += asset.weight * asset.expected_return;
    }
    
    // Portfolio volatility calculation (simplified for demonstration)
    double portfolio_variance = 0.0;
    for (size_t i = 0; i < portfolio.size(); ++i) {
        for (size_t j = 0; j < portfolio.size(); ++j) {
            portfolio_variance += portfolio[i].weight * portfolio[j].weight * 
                                portfolio[i].volatility * portfolio[j].volatility * 
                                correlation_matrix[i][j];
        }
    }
    double portfolio_volatility = std::sqrt(portfolio_variance);
    
    // Parallel Monte Carlo simulation using OpenMP
    #pragma omp parallel
    {
        // Each thread gets its own random number generator with unique seed
        std::mt19937 gen(std::random_device{}() + omp_get_thread_num());
        
        #pragma omp for
        for (int sim = 0; sim < num_simulations; ++sim) {
            auto asset_returns = generateCorrelatedReturns(gen, cholesky);
            portfolio_returns[sim] = calculatePortfolioReturn(asset_returns);
        }
    }
    
    // Create a copy for VaR calculation (sorts the vector)
    auto returns_copy = portfolio_returns;
    
    // Calculate risk metrics
    RiskMetrics metrics;
    metrics.expected_return = expected_portfolio_return;
    metrics.portfolio_vol = portfolio_volatility;
    metrics.var_95 = calculateVaR(returns_copy, 0.95);
    
    returns_copy = portfolio_returns; // Reset for 99% VaR
    metrics.var_99 = calculateVaR(returns_copy, 0.99);
    
    metrics.cvar_95 = calculateCVaR(portfolio_returns, 0.95, metrics.var_95);
    metrics.cvar_99 = calculateCVaR(portfolio_returns, 0.99, metrics.var_99);
    
    // Store simulation results
    metrics.simulation_results = std::move(portfolio_returns);
    
    return metrics;
}

void MonteCarloRiskEngine::setNumSimulations(int simulations) {
    if (simulations <= 0) {
        throw std::invalid_argument("Number of simulations must be positive");
    }
    num_simulations = simulations;
}

void MonteCarloRiskEngine::setTimeHorizon(double horizon) {
    if (horizon <= 0) {
        throw std::invalid_argument("Time horizon must be positive");
    }
    time_horizon = horizon;
}

void MonteCarloRiskEngine::updatePortfolio(const std::vector<PortfolioAsset>& assets) {
    if (assets.empty()) {
        throw std::invalid_argument("Portfolio cannot be empty");
    }
    portfolio = assets;
}

void MonteCarloRiskEngine::updateCorrelationMatrix(const std::vector<std::vector<double>>& corr_matrix) {
    if (corr_matrix.size() != portfolio.size() || 
        corr_matrix[0].size() != portfolio.size()) {
        throw std::invalid_argument("Correlation matrix dimensions must match portfolio size");
    }
    correlation_matrix = corr_matrix;
}