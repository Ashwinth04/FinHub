import { dbGet, dbRun, dbAll } from '../database/database.js';

export class Portfolio {
  constructor(id, user_id, name, description, is_default, created_at, updated_at) {
    this.id = id;
    this.user_id = user_id;
    this.name = name;
    this.description = description;
    this.is_default = is_default;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  // Create a new portfolio
  static async create(user_id, name, description, is_default = false) {
    try {
      // If this portfolio is marked as default, unset default on all other portfolios
      if (is_default) {
        await dbRun('UPDATE portfolios SET is_default = 0 WHERE user_id = ?', [user_id]);
      }

      const result = await dbRun(
        'INSERT INTO portfolios (user_id, name, description, is_default) VALUES (?, ?, ?, ?)',
        [user_id, name, description, is_default ? 1 : 0]
      );

      return await Portfolio.findById(result.id);
    } catch (error) {
      throw error;
    }
  }

  // Find portfolio by ID
  static async findById(id) {
    try {
      const portfolio = await dbGet('SELECT * FROM portfolios WHERE id = ?', [id]);
      return portfolio ? new Portfolio(
        portfolio.id,
        portfolio.user_id,
        portfolio.name,
        portfolio.description,
        portfolio.is_default,
        portfolio.created_at,
        portfolio.updated_at
      ) : null;
    } catch (error) {
      throw error;
    }
  }

  // Find portfolios by user ID
  static async findByUserId(user_id) {
    try {
      const portfolios = await dbAll('SELECT * FROM portfolios WHERE user_id = ? ORDER BY created_at DESC', [user_id]);
      return portfolios.map(p => new Portfolio(
        p.id,
        p.user_id,
        p.name,
        p.description,
        p.is_default,
        p.created_at,
        p.updated_at
      ));
    } catch (error) {
      throw error;
    }
  }

  // Update portfolio
  async update(name, description, is_default) {
    try {
      // If this portfolio is being marked as default, unset default on all other portfolios
      if (is_default && !this.is_default) {
        await dbRun('UPDATE portfolios SET is_default = 0 WHERE user_id = ? AND id != ?', [this.user_id, this.id]);
      }

      await dbRun(
        'UPDATE portfolios SET name = ?, description = ?, is_default = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [name, description, is_default ? 1 : 0, this.id]
      );

      this.name = name;
      this.description = description;
      this.is_default = is_default;
      this.updated_at = new Date().toISOString();

      return this;
    } catch (error) {
      throw error;
    }
  }

  // Delete portfolio
  async delete() {
    try {
      await dbRun('DELETE FROM portfolios WHERE id = ?', [this.id]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Get portfolio assets
  async getAssets() {
    try {
      const assets = await dbAll('SELECT * FROM assets WHERE portfolio_id = ? ORDER BY created_at DESC', [this.id]);
      return assets;
    } catch (error) {
      throw error;
    }
  }

  // Get portfolio value
  async getCurrentValue() {
    try {
      const assets = await this.getAssets();
      let totalValue = 0;

      for (const asset of assets) {
        // Get latest price for the asset
        const latestPrice = await dbGet(
          'SELECT price FROM asset_prices WHERE asset_id = ? ORDER BY price_date DESC LIMIT 1',
          [asset.id]
        );
        
        const currentPrice = latestPrice ? latestPrice.price : asset.purchase_price;
        totalValue += asset.quantity * currentPrice;
      }

      return totalValue;
    } catch (error) {
      throw error;
    }
  }

  // Calculate asset allocation
  async calculateAllocation() {
    try {
      const assets = await this.getAssets();
      const totalValue = await this.getCurrentValue();
      
      if (totalValue === 0) return {};

      const allocation = {};

      for (const asset of assets) {
        const latestPrice = await dbGet(
          'SELECT price FROM asset_prices WHERE asset_id = ? ORDER BY price_date DESC LIMIT 1',
          [asset.id]
        );
        
        const currentPrice = latestPrice ? latestPrice.price : asset.purchase_price;
        const assetValue = asset.quantity * currentPrice;
        const assetType = asset.type.charAt(0).toUpperCase() + asset.type.slice(1);

        if (allocation[assetType]) {
          allocation[assetType] += (assetValue / totalValue) * 100;
        } else {
          allocation[assetType] = (assetValue / totalValue) * 100;
        }
      }

      // Round to 2 decimal places
      Object.keys(allocation).forEach(key => {
        allocation[key] = parseFloat(allocation[key].toFixed(2));
      });

      return allocation;
    } catch (error) {
      throw error;
    }
  }

  // Return portfolio data without sensitive information
  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      name: this.name,
      description: this.description,
      is_default: this.is_default,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

export default Portfolio;