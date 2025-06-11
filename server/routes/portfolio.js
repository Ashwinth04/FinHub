import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Portfolio from '../models/Portfolio.js';
import Asset from '../models/Asset.js';
import { dbRun, dbGet, dbAll } from '../database/database.js';

const router = express.Router();

// Middleware to protect all routes
router.use(authenticate);

// Get all portfolios for the current user
router.get('/', async (req, res) => {
  try {
    const portfolios = await Portfolio.findByUserId(req.user.id);
    res.json(portfolios);
  } catch (err) {
    console.error('Get portfolios error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific portfolio with assets
router.get('/:id', async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id);
    
    if (!portfolio || portfolio.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

    const assets = await portfolio.getAssets();
    const currentValue = await portfolio.getCurrentValue();
    const allocation = await portfolio.calculateAllocation();

    // Calculate gain/loss
    let initialInvestment = 0;
    for (const asset of assets) {
      initialInvestment += asset.quantity * asset.purchase_price;
    }

    const result = {
      ...portfolio.toJSON(),
      assets,
      currentValue,
      initialInvestment,
      gainLoss: currentValue - initialInvestment,
      allocation
    };

    res.json(result);
  } catch (err) {
    console.error('Get portfolio error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new portfolio
router.post('/', async (req, res) => {
  try {
    const { name, description, is_default } = req.body;
    
    const portfolio = await Portfolio.create(req.user.id, name, description, is_default);
    res.status(201).json(portfolio);
  } catch (err) {
    console.error('Create portfolio error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a portfolio
router.put('/:id', async (req, res) => {
  try {
    const { name, description, is_default } = req.body;
    
    const portfolio = await Portfolio.findById(req.params.id);
    
    if (!portfolio || portfolio.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

    await portfolio.update(name, description, is_default);
    res.json(portfolio);
  } catch (err) {
    console.error('Update portfolio error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a portfolio
router.delete('/:id', async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id);
    
    if (!portfolio || portfolio.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

    await portfolio.delete();
    res.json({ message: 'Portfolio deleted' });
  } catch (err) {
    console.error('Delete portfolio error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add an asset to a portfolio
router.post('/:id/assets', async (req, res) => {
  try {
    const { name, symbol, type, quantity, purchase_price, purchase_date } = req.body;
    
    // Find the portfolio and verify ownership
    const portfolio = await Portfolio.findById(req.params.id);
    if (!portfolio || portfolio.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    
    // Insert the asset
    await dbRun(
      'INSERT INTO assets (portfolio_id, name, symbol, type, quantity, purchase_price, purchase_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.params.id, name, symbol, type, quantity, purchase_price, purchase_date]
    );
    
    // Return updated portfolio with assets
    const assets = await dbAll('SELECT * FROM assets WHERE portfolio_id = ? ORDER BY created_at DESC', [req.params.id]);
    const portfolioWithAssets = {
      ...portfolio.toJSON(),
      assets: assets
    };
    
    res.status(201).json(portfolioWithAssets);
  } catch (err) {
    console.error('Add asset error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update an asset
router.put('/:portfolioId/assets/:assetId', async (req, res) => {
  try {
    const { quantity, currentPrice } = req.body;
    
    const portfolio = await Portfolio.findById(req.params.portfolioId);
    
    if (!portfolio || portfolio.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

    const asset = await Asset.findById(req.params.assetId);
    
    if (!asset || asset.portfolio_id !== portfolio.id) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    await asset.update(quantity, currentPrice);
    res.json(asset);
  } catch (err) {
    console.error('Update asset error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove an asset
router.delete('/:portfolioId/assets/:assetId', async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.portfolioId);
    
    if (!portfolio || portfolio.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

    const asset = await Asset.findById(req.params.assetId);
    
    if (!asset || asset.portfolio_id !== portfolio.id) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    await asset.delete();
    res.json({ message: 'Asset removed' });
  } catch (err) {
    console.error('Remove asset error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;