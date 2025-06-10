import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create database connection
const dbPath = join(__dirname, 'portfolio.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
export const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create portfolios table
      db.run(`
        CREATE TABLE IF NOT EXISTS portfolios (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          is_default BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `);

      // Create assets table
      db.run(`
        CREATE TABLE IF NOT EXISTS assets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          portfolio_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          symbol TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('stock', 'bond', 'crypto', 'reit', 'cash', 'commodity')),
          quantity REAL NOT NULL,
          purchase_price REAL NOT NULL,
          purchase_date DATE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (portfolio_id) REFERENCES portfolios (id) ON DELETE CASCADE
        )
      `);

      // Create asset_prices table
      db.run(`
        CREATE TABLE IF NOT EXISTS asset_prices (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          asset_id INTEGER NOT NULL,
          price REAL NOT NULL,
          price_date DATE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (asset_id) REFERENCES assets (id) ON DELETE CASCADE
        )
      `);

      // Create portfolio_snapshots table
      db.run(`
        CREATE TABLE IF NOT EXISTS portfolio_snapshots (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          portfolio_id INTEGER NOT NULL,
          total_value REAL NOT NULL,
          snapshot_date DATE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (portfolio_id) REFERENCES portfolios (id) ON DELETE CASCADE
        )
      `);

      // Create risk_metrics table
      db.run(`
        CREATE TABLE IF NOT EXISTS risk_metrics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          portfolio_id INTEGER NOT NULL,
          volatility_daily REAL,
          volatility_annualized REAL,
          sharpe_ratio_daily REAL,
          sharpe_ratio_annualized REAL,
          max_drawdown REAL,
          max_drawdown_start_date DATE,
          max_drawdown_end_date DATE,
          max_drawdown_duration_days INTEGER,
          var_95 REAL,
          var_99 REAL,
          var_95_percent REAL,
          var_99_percent REAL,
          beta REAL,
          alpha REAL,
          calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (portfolio_id) REFERENCES portfolios (id) ON DELETE CASCADE
        )
      `);

      // Create asset_correlations table
      db.run(`
        CREATE TABLE IF NOT EXISTS asset_correlations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          portfolio_id INTEGER NOT NULL,
          asset_1_id INTEGER NOT NULL,
          asset_2_id INTEGER NOT NULL,
          correlation_coefficient REAL NOT NULL,
          calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (portfolio_id) REFERENCES portfolios (id) ON DELETE CASCADE,
          FOREIGN KEY (asset_1_id) REFERENCES assets (id) ON DELETE CASCADE,
          FOREIGN KEY (asset_2_id) REFERENCES assets (id) ON DELETE CASCADE
        )
      `);

      // Create optimization_results table
      db.run(`
        CREATE TABLE IF NOT EXISTS optimization_results (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          portfolio_id INTEGER NOT NULL,
          strategy TEXT NOT NULL CHECK (strategy IN ('maxSharpe', 'minVolatility', 'equalRisk')),
          risk_tolerance INTEGER,
          expected_return REAL,
          expected_risk REAL,
          sharpe_ratio REAL,
          weights TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (portfolio_id) REFERENCES portfolios (id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('Error creating tables:', err);
          reject(err);
        } else {
          console.log('All tables created successfully');
          resolve();
        }
      });

      // Create indexes for better performance
      db.run(`CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios (user_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_assets_portfolio_id ON assets (portfolio_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_asset_prices_asset_id ON asset_prices (asset_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_asset_prices_date ON asset_prices (price_date)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_portfolio_id ON portfolio_snapshots (portfolio_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_risk_metrics_portfolio_id ON risk_metrics (portfolio_id)`);
    });
  });
};

// Database helper functions
export const dbGet = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

export const dbRun = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

export const dbAll = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

export default db;