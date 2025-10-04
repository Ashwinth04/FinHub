import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Portfolio from '../models/Portfolio.js';
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
    
    // Get assets for this portfolio
    const assets = await dbAll('SELECT * FROM assets WHERE portfolio_id = ? ORDER BY created_at DESC', [req.params.id]);
    
    // Add assets to portfolio object
    const portfolioWithAssets = {
      ...portfolio.toJSON(),
      assets: assets
    };
    
    res.json(portfolioWithAssets);
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
    const { portfolioId, assetId } = req.params;
    const { name, symbol, type, quantity, purchase_price, purchase_date } = req.body;
    
    // Find the portfolio and verify ownership
    const portfolio = await Portfolio.findById(portfolioId);
    if (!portfolio || portfolio.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    
    // Update the asset
    await dbRun(
      'UPDATE assets SET name = ?, symbol = ?, type = ?, quantity = ?, purchase_price = ?, purchase_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND portfolio_id = ?',
      [name, symbol, type, quantity, purchase_price, purchase_date, assetId, portfolioId]
    );
    
    // Return updated portfolio with assets
    const assets = await dbAll('SELECT * FROM assets WHERE portfolio_id = ? ORDER BY created_at DESC', [portfolioId]);
    const portfolioWithAssets = {
      ...portfolio.toJSON(),
      assets: assets
    };
    
    res.json(portfolioWithAssets);
  } catch (err) {
    console.error('Update asset error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Apply optimized allocations by updating asset quantities
router.put('/:portfolioId/weights', async (req, res) => {
  try {
    const { portfolioId } = req.params;
    const weights = req.body;

    console.log("Received weights for optimization:", weights);
    console.log("Portfolio ID:", portfolioId);

    // Find the portfolio and verify ownership
    const portfolio = await Portfolio.findById(portfolioId);
    if (!portfolio || portfolio.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

    console.log("Portfolio found:", portfolio);

    // Get current assets
    const assets = await dbAll('SELECT * FROM assets WHERE portfolio_id = ?', [portfolioId]);

    console.log("Current assets:", assets);

    if (assets.length === 0) {
      return res.status(400).json({ message: 'No assets in portfolio to optimize' });
    }

    // Calculate total portfolio value
    const totalValue = assets.reduce((sum, asset) => {
      return sum + (asset.quantity * asset.purchase_price);
    }, 0);

    console.log("Total portfolio value:", totalValue);

    // Update each asset quantity according to optimized allocation
    for (const [assetId, assetData] of Object.entries(weights)) {
      const asset = assets.find(a => a.id == assetId);
      if (!asset) continue;

      const targetValue = totalValue * (assetData.optimizedAllocation / 100);
      const newQuantity = targetValue / asset.purchase_price;

      console.log(`Updating asset ${asset.symbol} (ID: ${assetId}) to new quantity:`, newQuantity);

      await dbRun(
        `UPDATE assets 
         SET quantity = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ? AND portfolio_id = ?`,
        [newQuantity, assetId, portfolioId]
      );
    }

    // Return updated portfolio with assets
    const updatedAssets = await dbAll(
      'SELECT * FROM assets WHERE portfolio_id = ? ORDER BY created_at DESC',
      [portfolioId]
    );

    console.log("Updated assets:", updatedAssets);

    const portfolioWithAssets = {
      ...portfolio.toJSON(),
      assets: updatedAssets
    };

    console.log("Returning updated portfolio with assets:", portfolioWithAssets);

    res.json(portfolioWithAssets);
  } catch (err) {
    console.error('Apply optimization error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// Delete an asset
router.delete('/:portfolioId/assets/:assetId', async (req, res) => {
  try {
    const { portfolioId, assetId } = req.params;
    
    // Find the portfolio and verify ownership
    const portfolio = await Portfolio.findById(portfolioId);
    if (!portfolio || portfolio.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    
    // Delete the asset
    await dbRun('DELETE FROM assets WHERE id = ? AND portfolio_id = ?', [assetId, portfolioId]);
    
    // Return updated portfolio with assets
    const assets = await dbAll('SELECT * FROM assets WHERE portfolio_id = ? ORDER BY created_at DESC', [portfolioId]);
    const portfolioWithAssets = {
      ...portfolio.toJSON(),
      assets: assets
    };
    
    res.json(portfolioWithAssets);
  } catch (err) {
    console.error('Delete asset error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;