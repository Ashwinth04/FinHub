import { dbGet, dbRun, dbAll } from '../database/database.js';

export class RiskMetrics {
  constructor(data) {
    Object.assign(this, data);
  }

  // Create or update risk metrics
  static async createOrUpdate(portfolio_id, metrics) {
    try {
      // Check if metrics already exist for this portfolio
      const existing = await dbGet('SELECT id FROM risk_metrics WHERE portfolio_id = ?', [portfolio_id]);

      if (existing) {
        // Update existing metrics
        await dbRun(`
          UPDATE risk_metrics SET 
            volatility_daily = ?, volatility_annualized = ?,
            sharpe_ratio_daily = ?, sharpe_ratio_annualized = ?,
            max_drawdown = ?, max_drawdown_start_date = ?, max_drawdown_end_date = ?, max_drawdown_duration_days = ?,
            var_95 = ?, var_99 = ?, var_95_percent = ?, var_99_percent = ?,
            beta = ?, alpha = ?, calculated_at = CURRENT_TIMESTAMP
          WHERE portfolio_id = ?
        `, [
          metrics.volatility_daily, metrics.volatility_annualized,
          metrics.sharpe_ratio_daily, metrics.sharpe_ratio_annualized,
          metrics.max_drawdown, metrics.max_drawdown_start_date, metrics.max_drawdown_end_date, metrics.max_drawdown_duration_days,
          metrics.var_95, metrics.var_99, metrics.var_95_percent, metrics.var_99_percent,
          metrics.beta, metrics.alpha, portfolio_id
        ]);
        return await RiskMetrics.findByPortfolioId(portfolio_id);
      } else {
        // Create new metrics
        const result = await dbRun(`
          INSERT INTO risk_metrics (
            portfolio_id, volatility_daily, volatility_annualized,
            sharpe_ratio_daily, sharpe_ratio_annualized,
            max_drawdown, max_drawdown_start_date, max_drawdown_end_date, max_drawdown_duration_days,
            var_95, var_99, var_95_percent, var_99_percent,
            beta, alpha
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          portfolio_id, metrics.volatility_daily, metrics.volatility_annualized,
          metrics.sharpe_ratio_daily, metrics.sharpe_ratio_annualized,
          metrics.max_drawdown, metrics.max_drawdown_start_date, metrics.max_drawdown_end_date, metrics.max_drawdown_duration_days,
          metrics.var_95, metrics.var_99, metrics.var_95_percent, metrics.var_99_percent,
          metrics.beta, metrics.alpha
        ]);
        return await RiskMetrics.findById(result.id);
      }
    } catch (error) {
      throw error;
    }
  }

  // Find risk metrics by ID
  static async findById(id) {
    try {
      const metrics = await dbGet('SELECT * FROM risk_metrics WHERE id = ?', [id]);
      return metrics ? new RiskMetrics(metrics) : null;
    } catch (error) {
      throw error;
    }
  }

  // Find risk metrics by portfolio ID
  static async findByPortfolioId(portfolio_id) {
    try {
      const metrics = await dbGet('SELECT * FROM risk_metrics WHERE portfolio_id = ? ORDER BY calculated_at DESC LIMIT 1', [portfolio_id]);
      return metrics ? new RiskMetrics(metrics) : null;
    } catch (error) {
      throw error;
    }
  }

  // Return metrics data
  toJSON() {
    return {
      id: this.id,
      portfolio_id: this.portfolio_id,
      volatility: {
        daily: this.volatility_daily,
        annualized: this.volatility_annualized
      },
      sharpeRatio: {
        daily: this.sharpe_ratio_daily,
        annualized: this.sharpe_ratio_annualized
      },
      maxDrawdown: {
        maxDrawdown: this.max_drawdown,
        startDate: this.max_drawdown_start_date,
        endDate: this.max_drawdown_end_date,
        durationDays: this.max_drawdown_duration_days
      },
      valueAtRisk: {
        var95: this.var_95,
        var99: this.var_99,
        var95Percent: this.var_95_percent,
        var99Percent: this.var_99_percent
      },
      beta: this.beta,
      alpha: this.alpha,
      calculated_at: this.calculated_at,
      created_at: this.created_at
    };
  }
}

export default RiskMetrics;