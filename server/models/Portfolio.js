import mongoose from 'mongoose';

const AssetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  symbol: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['stock', 'bond', 'crypto', 'reit', 'cash', 'commodity']
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  purchasePrice: {
    type: Number,
    required: true,
    min: 0
  },
  purchaseDate: {
    type: Date,
    required: true
  },
  currentPrice: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

const PortfolioSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  assets: [AssetSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  isDefault: {
    type: Boolean,
    default: false
  }
});

// Virtual for calculating current portfolio value
PortfolioSchema.virtual('currentValue').get(function() {
  return this.assets.reduce((total, asset) => {
    return total + (asset.currentPrice * asset.quantity);
  }, 0);
});

// Virtual for calculating initial investment
PortfolioSchema.virtual('initialInvestment').get(function() {
  return this.assets.reduce((total, asset) => {
    return total + (asset.purchasePrice * asset.quantity);
  }, 0);
});

// Virtual for calculating return
PortfolioSchema.virtual('return').get(function() {
  const initial = this.initialInvestment;
  if (initial === 0) return 0;
  
  return ((this.currentValue - initial) / initial) * 100;
});

// Method to calculate asset allocation by type
PortfolioSchema.methods.calculateAllocation = function() {
  const totalValue = this.currentValue;
  if (totalValue === 0) return {};
  
  const allocation = {};
  
  this.assets.forEach(asset => {
    const assetValue = asset.currentPrice * asset.quantity;
    const assetType = asset.type.charAt(0).toUpperCase() + asset.type.slice(1);
    
    if (allocation[assetType]) {
      allocation[assetType] += (assetValue / totalValue) * 100;
    } else {
      allocation[assetType] = (assetValue / totalValue) * 100;
    }
  });
  
  // Round to 2 decimal places
  Object.keys(allocation).forEach(key => {
    allocation[key] = parseFloat(allocation[key].toFixed(2));
  });
  
  return allocation;
};

const Portfolio = mongoose.model('Portfolio', PortfolioSchema);

export default Portfolio;