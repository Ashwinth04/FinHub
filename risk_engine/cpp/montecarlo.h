#ifndef MONTECARLO_H
#define MONTECARLO_H

#include <vector>
#include <random>
#include <memory>

struct PortfolioAsset {
    double weight;          // Portfolio weight
    double expected_return; // Expected annual return
    double volatility;      // Annual volatility
    std::string asset_name; // Asset identifier
};

struct RiskMetrics {
    double var_95;          // 95% Value at Risk
    double var_99;          // 99% Value at Risk
    double cvar_95;         // 95% Conditional Value at Risk
    double cvar_99;         // 99% Conditional Value at Risk
    double expected_return; // Expected portfolio return
    double portfolio_vol;   // Portfolio volatility
    std::vector<double> simulation_results; // All simulation results
};

class MonteCarloRiskEngine {
private:
    std::vector<PortfolioAsset> portfolio;
    std::vector<std::vector<double>> correlation_matrix;
    int num_simulations;
    double time_horizon; // Time horizon in years (e.g., 1/252 for 1 day)
    
    // Helper methods
    std::vector<std::vector<double>> choleskyDecomposition(const std::vector<std::vector<double>>& matrix);
    std::vector<double> generateCorrelatedReturns(std::mt19937& gen, 
                                                 const std::vector<std::vector<double>>& cholesky);
    double calculatePortfolioReturn(const std::vector<double>& asset_returns);
    double calculateVaR(std::vector<double>& returns, double confidence_level);
    double calculateCVaR(const std::vector<double>& returns, double confidence_level, double var_value);

public:
    MonteCarloRiskEngine(const std::vector<PortfolioAsset>& assets,
                        const std::vector<std::vector<double>>& corr_matrix,
                        int simulations = 100000,
                        double horizon = 1.0/252.0); // Default 1 day
    
    // Main simulation method with OpenMP parallelization
    RiskMetrics runSimulation();
    
    // Utility methods
    void setNumSimulations(int simulations);
    void setTimeHorizon(double horizon);
    void updatePortfolio(const std::vector<PortfolioAsset>& assets);
    void updateCorrelationMatrix(const std::vector<std::vector<double>>& corr_matrix);
};

#endif // MONTECARLO_H