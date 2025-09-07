#include <pybind11/pybind11.h>
#include <pybind11/stl.h>
#include <pybind11/numpy.h>
#include "montecarlo.h"

namespace py = pybind11;

PYBIND11_MODULE(risk_engine_cpp, m) {
    m.doc() = "Monte Carlo Risk Engine with VaR and CVaR calculations";

    // Bind PortfolioAsset struct
    py::class_<PortfolioAsset>(m, "PortfolioAsset")
        .def(py::init<>())
        .def_readwrite("weight", &PortfolioAsset::weight)
        .def_readwrite("expected_return", &PortfolioAsset::expected_return)
        .def_readwrite("volatility", &PortfolioAsset::volatility)
        .def_readwrite("asset_name", &PortfolioAsset::asset_name)
        .def("__repr__", [](const PortfolioAsset &a) {
            return "<PortfolioAsset name='" + a.asset_name + 
                   "' weight=" + std::to_string(a.weight) + 
                   " expected_return=" + std::to_string(a.expected_return) +
                   " volatility=" + std::to_string(a.volatility) + ">";
        });

    // Bind RiskMetrics struct
    py::class_<RiskMetrics>(m, "RiskMetrics")
        .def(py::init<>())
        .def_readwrite("var_95", &RiskMetrics::var_95)
        .def_readwrite("var_99", &RiskMetrics::var_99)
        .def_readwrite("cvar_95", &RiskMetrics::cvar_95)
        .def_readwrite("cvar_99", &RiskMetrics::cvar_99)
        .def_readwrite("expected_return", &RiskMetrics::expected_return)
        .def_readwrite("portfolio_vol", &RiskMetrics::portfolio_vol)
        .def_readwrite("simulation_results", &RiskMetrics::simulation_results)
        .def("__repr__", [](const RiskMetrics &r) {
            return "<RiskMetrics VaR95=" + std::to_string(r.var_95) + 
                   " VaR99=" + std::to_string(r.var_99) +
                   " CVaR95=" + std::to_string(r.cvar_95) + 
                   " CVaR99=" + std::to_string(r.cvar_99) + ">";
        });

    // Bind MonteCarloRiskEngine class
    py::class_<MonteCarloRiskEngine>(m, "MonteCarloRiskEngine")
        .def(py::init<const std::vector<PortfolioAsset>&, 
                      const std::vector<std::vector<double>>&,
                      int, double>(),
             py::arg("assets"), 
             py::arg("correlation_matrix"), 
             py::arg("simulations") = 100000,
             py::arg("time_horizon") = 1.0/252.0)
        .def("run_simulation", &MonteCarloRiskEngine::runSimulation,
             "Run Monte Carlo simulation and calculate risk metrics")
        .def("set_num_simulations", &MonteCarloRiskEngine::setNumSimulations,
             py::arg("simulations"),
             "Set number of Monte Carlo simulations")
        .def("set_time_horizon", &MonteCarloRiskEngine::setTimeHorizon,
             py::arg("horizon"),
             "Set time horizon for risk calculations")
        .def("update_portfolio", &MonteCarloRiskEngine::updatePortfolio,
             py::arg("assets"),
             "Update portfolio assets")
        .def("update_correlation_matrix", &MonteCarloRiskEngine::updateCorrelationMatrix,
             py::arg("correlation_matrix"),
             "Update correlation matrix");

    // Helper function to create PortfolioAsset from Python dict
    m.def("create_portfolio_asset", [](const std::string& name, double weight, 
                                      double expected_return, double volatility) {
        PortfolioAsset asset;
        asset.asset_name = name;
        asset.weight = weight;
        asset.expected_return = expected_return;
        asset.volatility = volatility;
        return asset;
    }, "Create a PortfolioAsset instance");

    // Convenience function for running risk calculation from Python data
    m.def("calculate_portfolio_risk", 
          [](const std::vector<std::string>& asset_names,
             const std::vector<double>& weights,
             const std::vector<double>& expected_returns,
             const std::vector<double>& volatilities,
             const std::vector<std::vector<double>>& correlation_matrix,
             int num_simulations = 100000,
             double time_horizon = 1.0/252.0) {
              
              if (asset_names.size() != weights.size() || 
                  weights.size() != expected_returns.size() ||
                  expected_returns.size() != volatilities.size()) {
                  throw std::invalid_argument("All asset vectors must have the same size");
              }
              
              std::vector<PortfolioAsset> assets;
              for (size_t i = 0; i < asset_names.size(); ++i) {
                  PortfolioAsset asset;
                  asset.asset_name = asset_names[i];
                  asset.weight = weights[i];
                  asset.expected_return = expected_returns[i];
                  asset.volatility = volatilities[i];
                  assets.push_back(asset);
              }
              
              MonteCarloRiskEngine engine(assets, correlation_matrix, num_simulations, time_horizon);
              return engine.runSimulation();
          },
          py::arg("asset_names"),
          py::arg("weights"),
          py::arg("expected_returns"),
          py::arg("volatilities"),
          py::arg("correlation_matrix"),
          py::arg("num_simulations") = 100000,
          py::arg("time_horizon") = 1.0/252.0,
          "Calculate portfolio risk metrics from Python lists");
}