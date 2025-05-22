import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Portfolio from '../models/Portfolio.js';

const router = express.Router();

// Middleware to protect all routes
router.use(authenticate);

// Get all portfolios for the current user
router.get('/', async (req, res) => {
  try {
    const portfolios = await Portfolio.find({ user: req.user._id });
    res.json(portfolios);
  } catch (err) {
    console.error('Get portfolios error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific portfolio
router.get('/:id', async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    
    // Calculate virtual properties
    const result = portfolio.toObject({ virtuals: true });
    
    // Add asset allocation
    result.allocation = portfolio.calculateAllocation();
    
    res.json(result);
  } catch (err) {
    console.error('Get portfolio error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new portfolio
router.post('/', async (req, res) => {
  try {
    const { name, description, assets, isDefault } = req.body;
    
    // If this portfolio is marked as default, unset default on all other portfolios
    if (isDefault) {
      await Portfolio.updateMany(
        { user: req.user._id },
        { $set: { isDefault: false } }
      );
    }
    
    const portfolio = new Portfolio({
      user: req.user._id,
      name,
      description,
      assets: assets || [],
      isDefault
    });
    
    await portfolio.save();
    res.status(201).json(portfolio);
  } catch (err) {
    console.error('Create portfolio error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a portfolio
router.put('/:id', async (req, res) => {
  try {
    const { name, description, isDefault } = req.body;
    
    // Find the portfolio
    let portfolio = await Portfolio.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    
    // If this portfolio is being marked as default, unset default on all other portfolios
    if (isDefault && !portfolio.isDefault) {
      await Portfolio.updateMany(
        { user: req.user._id, _id: { $ne: portfolio._id } },
        { $set: { isDefault: false } }
      );
    }
    
    // Update fields
    if (name) portfolio.name = name;
    if (description !== undefined) portfolio.description = description;
    if (isDefault !== undefined) portfolio.isDefault = isDefault;
    
    await portfolio.save();
    res.json(portfolio);
  } catch (err) {
    console.error('Update portfolio error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a portfolio
router.delete('/:id', async (req, res) => {
  try {
    const portfolio = await Portfolio.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    
    res.json({ message: 'Portfolio deleted' });
  } catch (err) {
    console.error('Delete portfolio error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add an asset to a portfolio
router.post('/:id/assets', async (req, res) => {
  try {
    const { name, symbol, type, quantity, purchasePrice, purchaseDate } = req.body;
    
    // Find the portfolio
    const portfolio = await Portfolio.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    
    // Create new asset
    const newAsset = {
      name,
      symbol,
      type,
      quantity,
      purchasePrice,
      purchaseDate: new Date(purchaseDate),
      currentPrice: purchasePrice, // Default to purchase price initially
      lastUpdated: new Date()
    };
    
    // Add to portfolio
    portfolio.assets.push(newAsset);
    await portfolio.save();
    
    res.status(201).json(portfolio);
  } catch (err) {
    console.error('Add asset error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update an asset
router.put('/:portfolioId/assets/:assetId', async (req, res) => {
  try {
    const { quantity, currentPrice } = req.body;
    
    // Find the portfolio
    const portfolio = await Portfolio.findOne({
      _id: req.params.portfolioId,
      user: req.user._id
    });
    
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    
    // Find the asset
    const asset = portfolio.assets.id(req.params.assetId);
    
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    
    // Update fields
    if (quantity !== undefined) asset.quantity = quantity;
    if (currentPrice !== undefined) {
      asset.currentPrice = currentPrice;
      asset.lastUpdated = new Date();
    }
    
    await portfolio.save();
    res.json(portfolio);
  } catch (err) {
    console.error('Update asset error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove an asset
router.delete('/:portfolioId/assets/:assetId', async (req, res) => {
  try {
    // Find the portfolio
    const portfolio = await Portfolio.findOne({
      _id: req.params.portfolioId,
      user: req.user._id
    });
    
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    
    // Remove the asset
    portfolio.assets.id(req.params.assetId).deleteOne();
    await portfolio.save();
    
    res.json({ message: 'Asset removed' });
  } catch (err) {
    console.error('Remove asset error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;