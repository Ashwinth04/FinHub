import { dbGet, dbRun, dbAll } from '../database/database.js';

export class Asset {
  constructor(id, portfolio_id, name, symbol, type, quantity, purchase_price, purchase_date, created_at, updated_at) {
    this.id = id;
    this.portfolio_id = portfolio_id;
    this.name = name;
    this.symbol = symbol;
    this.type = type;
    this.quantity = quantity;
    this.purchase_price = purchase_price;
    this.purchase_date = purchase_date;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  // Create a new asset
  static async create(portfolio_id, name, symbol, type, quantity, purchase_price, purchase_date) {
    try {
      const result = await dbRun(
        'INSERT INTO assets (portfolio_id, name, symbol, type, quantity, purchase_price, purchase_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [portfolio_id, name, symbol, type, quantity, purchase_price, purchase_date]
      );

      // Create initial price entry
      await dbRun(
        'INSERT INTO asset_prices (asset_id, price, price_date) VALUES (?, ?, ?)',
        [result.id, purchase_price, purchase_date]
      );

      return await Asset.findById(result.id);
    } catch (error) {
      throw error;
    }
  }

  // Find asset by ID
  static async findById(id) {
    try {
      const asset = await dbGet('SELECT * FROM assets WHERE id = ?', [id]);
      return asset ? new Asset(
        asset.id,
        asset.portfolio_id,
        asset.name,
        asset.symbol,
        asset.type,
        asset.quantity,
        asset.purchase_price,
        asset.purchase_date,
        asset.created_at,
        asset.updated_at
      ) : null;
    } catch (error) {
      throw error;
    }
  }

  // Find assets by portfolio ID
  static async findByPortfolioId(portfolio_id) {
    try {
      const assets = await dbAll('SELECT * FROM assets WHERE portfolio_id = ? ORDER BY created_at DESC', [portfolio_id]);
      return assets.map(a => new Asset(
        a.id,
        a.portfolio_id,
        a.name,
        a.symbol,
        a.type,
        a.quantity,
        a.purchase_price,
        a.purchase_date,
        a.created_at,
        a.updated_at
      ));
    } catch (error) {
      throw error;
    }
  }

  // Update asset
  async update(quantity, currentPrice) {
    try {
      if (quantity !== undefined) {
        await dbRun(
          'UPDATE assets SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [quantity, this.id]
        );
        this.quantity = quantity;
      }

      if (currentPrice !== undefined) {
        // Add new price entry
        await dbRun(
          'INSERT INTO asset_prices (asset_id, price, price_date) VALUES (?, ?, DATE("now"))',
          [this.id, currentPrice]
        );
      }

      this.updated_at = new Date().toISOString();
      return this;
    } catch (error) {
      throw error;
    }
  }

  // Delete asset
  async delete() {
    try {
      await dbRun('DELETE FROM assets WHERE id = ?', [this.id]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Get current price
  async getCurrentPrice() {
    try {
      const latestPrice = await dbGet(
        'SELECT price FROM asset_prices WHERE asset_id = ? ORDER BY price_date DESC LIMIT 1',
        [this.id]
      );
      return latestPrice ? latestPrice.price : this.purchase_price;
    } catch (error) {
      throw error;
    }
  }

  // Get price history
  async getPriceHistory(days = 30) {
    try {
      const prices = await dbAll(
        'SELECT price, price_date FROM asset_prices WHERE asset_id = ? AND price_date >= DATE("now", "-" || ? || " days") ORDER BY price_date ASC',
        [this.id, days]
      );
      return prices;
    } catch (error) {
      throw error;
    }
  }

  // Return asset data
  toJSON() {
    return {
      id: this.id,
      portfolio_id: this.portfolio_id,
      name: this.name,
      symbol: this.symbol,
      type: this.type,
      quantity: this.quantity,
      purchase_price: this.purchase_price,
      purchase_date: this.purchase_date,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

export default Asset;