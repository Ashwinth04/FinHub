import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt
from typing import List, Dict, Tuple, Optional, Union
from datetime import datetime, timedelta
import yfinance as yf

TOP_STOCKS = [
    'AAPL',  # Apple
    'MSFT',  # Microsoft
    'AMZN',  # Amazon
    'GOOGL', # Alphabet
    'META',  # Meta Platforms
    'TSLA',  # Tesla
    'BRK-B', # Berkshire Hathaway
    'JPM',   # JPMorgan Chase
    'JNJ',   # Johnson & Johnson
    'V'      # Visa
]

def prepare_data_pipeline(fetch_historical_data_fn, tickers, window_size=252):
    """
    Prepare data pipeline for model training and evaluation
    
    Args:
        fetch_historical_data_fn: Function to fetch historical data for a ticker
        tickers: List of tickers to include
        window_size: Number of days to use for historical window
        
    Returns:
        train_loader, val_loader, test_loader, (returns_dict, features_dict)
    """
    print(f"Preparing data for tickers: {tickers}")
    
    # Fetch data for all tickers
    raw_data = {}
    failed_tickers = []
    
    for ticker in tickers:
        try:
            print(f"Fetching data for {ticker}...")
            data = fetch_historical_data_fn(ticker)
            if data is not None and not data.empty:
                raw_data[ticker] = data
                print(f"Successfully fetched data for {ticker}: {len(data)} rows")
            else:
                failed_tickers.append(ticker)
                print(f"No data returned for {ticker}")
        except Exception as e:
            failed_tickers.append(ticker)
            print(f"Error fetching data for {ticker}: {e}")
    
    if not raw_data:
        raise ValueError("No data could be fetched for any ticker")
    
    if failed_tickers:
        print(f"Warning: Failed to fetch data for: {failed_tickers}")
    
    print(f"Successfully fetched data for {len(raw_data)} tickers")
    
    # Process data
    processor = DataProcessor()
    
    # Calculate returns and features
    returns_dict = {}
    features_dict = {}
    
    for ticker, df in raw_data.items():
        try:
            print(f"Processing {ticker}...")
            
            # Calculate returns
            returns = processor.calculate_returns(df)
            if not returns.empty:
                returns_dict[ticker] = returns
                print(f"Calculated returns for {ticker}: {len(returns)} data points")
            
            # Calculate features
            features = processor.calculate_features(df)
            if not features.empty:
                features_dict[ticker] = features
                print(f"Calculated features for {ticker}: {len(features)} data points, {len(features.columns)} features")
            
        except Exception as e:
            print(f"Error processing {ticker}: {e}")
            continue
    
    if not returns_dict or not features_dict:
        raise ValueError("No valid returns or features could be calculated")
    
    print("Aligning data across assets...")
    # Align data across all assets
    returns_dict = processor.align_data_for_multiple_assets(returns_dict)
    features_dict = processor.align_data_for_multiple_assets(features_dict)
    
    print("Normalizing features...")
    # Normalize features
    features_dict = processor.normalize_features(features_dict)
    
    # Get the final list of valid tickers
    valid_tickers = list(set(returns_dict.keys()).intersection(set(features_dict.keys())))
    print(f"Final valid tickers: {valid_tickers}")
    
    if len(valid_tickers) < 2:
        raise ValueError(f"Need at least 2 valid tickers for portfolio optimization, but only have: {valid_tickers}")
    
    print("Creating datasets...")
    # Create datasets
    try:
        train_dataset = PortfolioDataset(
            returns_dict=returns_dict,
            features_dict=features_dict,
            window_size=window_size,
            num_samples=1000,  # Reduced for faster training
            tickers=valid_tickers,
            training=True
        )
        
        val_dataset = PortfolioDataset(
            returns_dict=returns_dict,
            features_dict=features_dict,
            window_size=window_size,
            num_samples=200,  # Reduced for faster validation
            tickers=valid_tickers,
            training=True
        )
        
        test_dataset = PortfolioDataset(
            returns_dict=returns_dict,
            features_dict=features_dict,
            window_size=window_size,
            num_samples=100,
            tickers=valid_tickers,
            training=False
        )
    except Exception as e:
        print(f"Error creating datasets: {e}")
        raise
    
    print("Creating data loaders...")
    # Create data loaders
    train_loader = DataLoader(train_dataset, batch_size=16, shuffle=True)  # Reduced batch size
    val_loader = DataLoader(val_dataset, batch_size=32, shuffle=False)
    test_loader = DataLoader(test_dataset, batch_size=32, shuffle=False)
    
    print("Data pipeline preparation completed successfully!")
    return train_loader, val_loader, test_loader, (returns_dict, features_dict)

def fetch_historical_data(ticker: str):

        end_date = datetime.today()
        start_date = end_date - timedelta(days=1825)
        end_str = end_date.strftime("%Y-%m-%d")
        start_str = start_date.strftime("%Y-%m-%d")

        stock = yf.Ticker(ticker)
        hist = stock.history(start=start_str, end=end_str)
        hist.reset_index(inplace=True)

        return hist

class DataProcessor:
    """Module for processing historical price data"""
    
    @staticmethod
    def calculate_returns(prices_df: pd.DataFrame, period: int = 1) -> pd.DataFrame:
        """Calculate returns from price data using closing prices"""
        return prices_df['Close'].pct_change(period).dropna()
    
    @staticmethod
    def calculate_features(prices_df: pd.DataFrame, window: int = 20) -> pd.DataFrame:
        """Extract features from price data"""
        # Using closing prices for calculations
        close_prices = prices_df['Close'].values
        
        features = pd.DataFrame(index=prices_df.index)
        
        # Returns over different periods
        features['returns_1d'] = prices_df['Close'].pct_change(1)
        
        # Volatility features
        features['volatility_20d'] = features['returns_1d'].rolling(window=window).std()
        
        # Momentum features - fixed the calculation
        features['momentum_20d'] = prices_df['Close'] / prices_df['Close'].shift(window) - 1
        
        # Volume features if available
        if 'Volume' in prices_df.columns:
            features['volume_ratio'] = prices_df['Volume'] / prices_df['Volume'].rolling(window=window).mean()
        else:
            # If no volume data, create a dummy feature
            features['volume_ratio'] = 1.0
        
        return features.dropna()
    
    @staticmethod
    def align_data_for_multiple_assets(assets_data: Dict[str, pd.DataFrame]) -> Dict[str, pd.DataFrame]:
        """Ensure all assets data have the same date range"""
        if not assets_data:
            return {}
        
        # Find common date range
        common_dates = None
        
        for ticker, df in assets_data.items():
            ticker_dates = set(df.index)
            if common_dates is None:
                common_dates = ticker_dates
            else:
                common_dates = common_dates.intersection(ticker_dates)
        
        # Convert to sorted list for indexing
        common_dates = sorted(list(common_dates))
        
        if len(common_dates) == 0:
            raise ValueError("No common dates found across all assets")
        
        # Filter all dataframes to common date range
        aligned_data = {}
        for ticker, df in assets_data.items():
            aligned_data[ticker] = df.loc[common_dates].sort_index()
            
        return aligned_data
    
    @staticmethod
    def normalize_features(features_dict: Dict[str, pd.DataFrame]) -> Dict[str, pd.DataFrame]:
        """Normalize features for all assets"""
        if not features_dict:
            return {}
        
        scaler = StandardScaler()
        normalized_features = {}
        
        # Combine all features to fit the scaler
        all_features_list = []
        for df in features_dict.values():
            if not df.empty:
                all_features_list.append(df)
        
        if not all_features_list:
            return features_dict
        
        all_features = pd.concat(all_features_list, axis=0)
        
        # Handle NaN values before scaling
        all_features_clean = all_features.fillna(0)
        
        scaler.fit(all_features_clean.values)
        
        # Apply the scaler to each asset's features
        for ticker, features in features_dict.items():
            if not features.empty:
                features_clean = features.fillna(0)
                normalized_data = scaler.transform(features_clean.values)
                normalized_features[ticker] = pd.DataFrame(
                    normalized_data,
                    index=features.index,
                    columns=features.columns
                )
            else:
                normalized_features[ticker] = features
            
        return normalized_features


class PortfolioDataset(Dataset):
    """Dataset for portfolio optimization model training and evaluation"""
    
    def __init__(self, 
                 returns_dict: Dict[str, pd.DataFrame],
                 features_dict: Dict[str, pd.DataFrame],
                 window_size: int = 252,
                 num_samples: int = 1000,
                 tickers: List[str] = TOP_STOCKS,
                 training: bool = True):
        """
        Initialize dataset
        
        Args:
            returns_dict: Dictionary of returns dataframes for each ticker
            features_dict: Dictionary of features dataframes for each ticker
            window_size: Number of days to use for historical window
            num_samples: Number of samples to generate for training
            tickers: List of tickers to include in the universe
            training: Whether this is for training (random sampling) or testing
        """
        self.returns_dict = returns_dict
        self.features_dict = features_dict
        self.window_size = window_size
        self.num_samples = num_samples
        self.tickers = tickers
        self.num_assets = len(tickers)
        self.training = training
        
        # Ensure all tickers have data
        valid_tickers = []
        for ticker in self.tickers:
            if ticker in self.returns_dict and ticker in self.features_dict:
                valid_tickers.append(ticker)
        
        self.tickers = valid_tickers
        self.num_assets = len(valid_tickers)
        
        # Find common dates across all tickers for both returns and features
        common_dates = None
        for ticker in self.tickers:
            returns_dates = set(self.returns_dict[ticker].index.to_list())
            features_dates = set(self.features_dict[ticker].index.to_list())
            ticker_dates = returns_dates.intersection(features_dates)
            
            print(f"Common dates: {sorted(list(returns_dates))[:10]},\n\n{sorted(list(features_dates))[:10]}")

            if common_dates is None:
                common_dates = ticker_dates
            else:
                common_dates = common_dates.intersection(ticker_dates)
        
        # Convert to list and sort
        self.aligned_dates = sorted(list(common_dates))
        
        # Ensure there's enough data for the window size
        if len(self.aligned_dates) <= window_size:
            raise ValueError(f"Not enough data for window size {window_size}. Only {len(self.aligned_dates)} dates available.")
        
        self.valid_start_indices = list(range(len(self.aligned_dates) - window_size))
        
    def __len__(self):
        if self.training:
            return self.num_samples
        else:
            return len(self.valid_start_indices)
        
    def __getitem__(self, idx):
        if self.training:
            # Random starting point for training
            start_idx = np.random.choice(self.valid_start_indices)
            
            # Random subset of assets (at least 2 assets)
            num_active = np.random.randint(2, self.num_assets + 1)
            active_indices = np.random.choice(self.num_assets, num_active, replace=False)
            
            # Random optimization strategy (0: Max Sharpe, 1: Min Vol, 2: ERC)
            strategy = np.random.randint(0, 3)
            
            # Random risk tolerance
            risk_tolerance = np.random.randint(1, 11)
            
        else:
            # Sequential for testing
            start_idx = self.valid_start_indices[idx]
            
            # Use all assets for testing
            active_indices = np.arange(self.num_assets)
            
            # Fixed parameters for consistent testing
            strategy = 0  # Max Sharpe
            risk_tolerance = 5  # Moderate risk
        
        # Get the corresponding dates for this window
        end_idx = start_idx + self.window_size
        window_dates = self.aligned_dates[start_idx:end_idx]
        
        # Create mask for active assets
        mask = np.zeros(self.num_assets)
        mask[active_indices] = 1
        
        # Prepare strategy one-hot encoding
        strategy_onehot = np.zeros(3)
        strategy_onehot[strategy] = 1
        
        # Collect returns and features for all assets in the window
        returns_window = np.zeros((self.window_size, self.num_assets))
        features_window = np.zeros((self.window_size, self.num_assets, 4))  # Assuming 4 features per asset
        
        for i, ticker in enumerate(self.tickers):
            # Extract returns for this window
            ticker_returns = self.returns_dict[ticker].loc[window_dates].values
            returns_window[:, i] = ticker_returns
            
            # Extract features for this window
            ticker_features = self.features_dict[ticker].loc[window_dates].values
            # Handle case where features might have different dimensions
            if ticker_features.ndim == 1:
                features_window[:, i, 0] = ticker_features
            else:
                # Handle case where the feature matrix may have fewer than 4 features
                n_features = min(ticker_features.shape[1], 4)
                features_window[:, i, :n_features] = ticker_features[:, :n_features]
        
        # Calculate target weights based on strategy and active assets
        active_returns = returns_window[:, active_indices]
        target_weights = self._calculate_target_weights(
            active_returns,
            strategy,
            risk_tolerance,
            active_indices
        )
        
        return {
            'returns': torch.tensor(returns_window, dtype=torch.float32),
            'features': torch.tensor(features_window, dtype=torch.float32),
            'mask': torch.tensor(mask, dtype=torch.float32),
            'strategy': torch.tensor(strategy_onehot, dtype=torch.float32),
            'risk_tolerance': torch.tensor([risk_tolerance/10.0], dtype=torch.float32),
            'target_weights': torch.tensor(target_weights, dtype=torch.float32)
        }
    
    def _calculate_target_weights(self, 
                                 returns: np.ndarray,
                                 strategy: int,
                                 risk_tolerance: int,
                                 active_indices: np.ndarray) -> np.ndarray:
        """Calculate target weights based on optimization strategy
        
        Args:
            returns: Returns array for active assets [window_size, num_active]
            strategy: Strategy index (0: Max Sharpe, 1: Min Vol, 2: ERC)
            risk_tolerance: Risk tolerance level (1-10)
            active_indices: Indices of active assets
            
        Returns:
            Array of target weights [num_assets]
        """
        num_active = len(active_indices)
        full_weights = np.zeros(self.num_assets)
        
        # Skip the first few returns which might be NaN
        valid_returns = returns[~np.isnan(returns).any(axis=1)]
        
        # If no valid returns, use equal weights
        if len(valid_returns) < 2:
            active_weights = np.ones(num_active) / num_active
            full_weights[active_indices] = active_weights
            return full_weights
        
        if strategy == 0:  # Maximum Sharpe Ratio
            # Simple estimation of Sharpe-optimal weights
            mean_returns = np.mean(valid_returns, axis=0)
            cov_matrix = np.cov(valid_returns.T) if valid_returns.shape[0] > 1 else np.eye(valid_returns.shape[1])
            
            # Handle potential numerical issues
            if np.any(np.diag(cov_matrix) <= 0):
                active_weights = np.ones(num_active) / num_active
            else:
                # Simplified approach, not true max Sharpe optimization
                vol = np.sqrt(np.diag(cov_matrix))
                sharpe = mean_returns / vol
                
                # Adjust based on risk tolerance
                sharpe_adj = sharpe * (risk_tolerance / 5.0)
                
                if np.sum(sharpe_adj > 0) > 0:
                    active_weights = np.maximum(sharpe_adj, 0)
                    if np.sum(active_weights) > 0:
                        active_weights = active_weights / np.sum(active_weights)
                    else:
                        active_weights = np.ones(num_active) / num_active
                else:
                    active_weights = np.ones(num_active) / num_active
                    
        elif strategy == 1:  # Minimum Volatility
            # Simple estimation of min-vol weights
            if valid_returns.shape[0] > 1:
                cov_matrix = np.cov(valid_returns.T)
            else:
                # If not enough data, use identity matrix
                cov_matrix = np.eye(valid_returns.shape[1])
            
            # Use inverse volatility weighting as an approximation
            vol = np.sqrt(np.diag(cov_matrix))
            if np.any(vol <= 0):
                active_weights = np.ones(num_active) / num_active
            else:
                inv_vol = 1.0 / vol
                active_weights = inv_vol / np.sum(inv_vol)
                
            # Adjust towards equal weights for higher risk tolerance
            equal_weights = np.ones(num_active) / num_active
            risk_factor = risk_tolerance / 10.0
            active_weights = (1 - risk_factor) * active_weights + risk_factor * equal_weights
                
        else:  # Equal Risk Contribution
            if valid_returns.shape[0] > 1:
                cov_matrix = np.cov(valid_returns.T)
            else:
                # If not enough data, use identity matrix
                cov_matrix = np.eye(valid_returns.shape[1])
                
            active_weights = self._equal_risk_contribution(cov_matrix)
            
            # For higher risk tolerance, allow more concentration
            if risk_tolerance > 5:
                mean_returns = np.mean(valid_returns, axis=0)
                
                # Find the assets with above-average returns
                above_avg = mean_returns > np.mean(mean_returns)
                
                # Skew weights towards better performers based on risk tolerance
                skew_factor = (risk_tolerance - 5) / 5.0
                skew = 1.0 + skew_factor * above_avg
                
                active_weights = active_weights * skew
                if np.sum(active_weights) > 0:
                    active_weights = active_weights / np.sum(active_weights)
                else:
                    active_weights = np.ones(num_active) / num_active
        
        # Assign weights to active assets in the full portfolio
        full_weights[active_indices] = active_weights
        return full_weights
    
    def _equal_risk_contribution(self, cov_matrix: np.ndarray) -> np.ndarray:
        """Calculate weights for equal risk contribution
        
        Args:
            cov_matrix: Covariance matrix [num_active, num_active]
            
        Returns:
            Array of weights [num_active]
        """
        n = cov_matrix.shape[0]
        weights = np.ones(n) / n
        
        # Handle case where covariance matrix is all zeros
        if np.all(cov_matrix == 0):
            return weights
        
        # Simple optimization approach for ERC
        for _ in range(100):
            # Calculate portfolio volatility
            portfolio_vol = np.sqrt(weights.T @ cov_matrix @ weights)
            
            # Avoid division by zero
            if portfolio_vol <= 1e-10:
                return np.ones(n) / n
            
            # Calculate marginal risk contribution
            marginal_contrib = (cov_matrix @ weights) / portfolio_vol
            
            # Calculate risk contribution
            risk_contrib = weights * marginal_contrib
            
            # Target equal risk contribution
            target_risk = np.sum(risk_contrib) / n
            
            # Update weights - move towards equal risk contribution
            # Avoid division by zero
            adjustment = np.ones(n)
            for i in range(n):
                if risk_contrib[i] > 1e-10:
                    adjustment[i] = target_risk / risk_contrib[i]
            
            weights = weights * adjustment
            weights = weights / np.sum(weights)
        
        return weights


class AttentionBlock(nn.Module):
    """Self-attention block for modeling asset interactions"""
    
    def __init__(self, hidden_dim: int, num_heads: int = 4):
        super(AttentionBlock, self).__init__()
        self.attention = nn.MultiheadAttention(hidden_dim, num_heads, batch_first=True)
        self.norm1 = nn.LayerNorm(hidden_dim)
        self.norm2 = nn.LayerNorm(hidden_dim)
        self.ffn = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim * 4),
            nn.GELU(),
            nn.Linear(hidden_dim * 4, hidden_dim)
        )
        
    def forward(self, x):
        # Self-attention with residual connection
        attn_output, _ = self.attention(x, x, x)
        x = self.norm1(x + attn_output)
        
        # Feed-forward with residual connection
        ffn_output = self.ffn(x)
        x = self.norm2(x + ffn_output)
        
        return x


class AssetEncoder(nn.Module):
    """Encodes historical asset data into embeddings"""
    
    def __init__(self, 
                 input_dim: int, 
                 hidden_dim: int, 
                 window_size: int,
                 num_layers: int = 1):
        super(AssetEncoder, self).__init__()
        
        self.feature_extractor = nn.Sequential(
            nn.Conv1d(input_dim, hidden_dim, kernel_size=5, padding=2),
            nn.GELU(),
            nn.MaxPool1d(kernel_size=2, stride=2),
            nn.Conv1d(hidden_dim, hidden_dim, kernel_size=5, padding=2),
            nn.GELU(),
            nn.MaxPool1d(kernel_size=2, stride=2)
        )
        
        # Calculate output size after pooling
        self.pooled_size = window_size // 4
        
        self.lstm = nn.LSTM(
            hidden_dim, 
            hidden_dim, 
            num_layers=num_layers, 
            batch_first=True, 
            bidirectional=True
        )
        
        self.output_proj = nn.Linear(hidden_dim * 2, hidden_dim)
        
    def forward(self, x):
        # x shape: [batch_size, window_size, input_dim]
        batch_size, window_size, input_dim = x.size()
        
        # Prepare for Conv1d [batch_size, input_dim, window_size]
        x = x.transpose(1, 2)
        
        # Extract features
        x = self.feature_extractor(x)  # [batch_size, hidden_dim, pooled_size]
        
        # Prepare for LSTM [batch_size, pooled_size, hidden_dim]
        x = x.transpose(1, 2)
        
        # Process with LSTM
        lstm_out, _ = self.lstm(x)  # [batch_size, pooled_size, hidden_dim*2]
        
        # Use the final output of the LSTM
        x = lstm_out[:, -1, :]  # [batch_size, hidden_dim*2]
        
        # Project to final embedding dimension
        x = self.output_proj(x)  # [batch_size, hidden_dim]
        
        return x


class PortfolioOptimizationModel(nn.Module):
    """End-to-end portfolio optimization model"""
    
    def __init__(self, 
                 num_assets: int = 10, 
                 window_size: int = 252, 
                 hidden_dim: int = 64,
                 feature_dim: int = 4,
                 num_strategies: int = 3):
        super(PortfolioOptimizationModel, self).__init__()
        
        self.num_assets = num_assets
        
        # Asset-specific encoders
        self.return_encoder = AssetEncoder(1, hidden_dim, window_size)
        self.feature_encoder = AssetEncoder(feature_dim, hidden_dim, window_size)
        
        # Asset embedding combination
        self.asset_combiner = nn.Linear(hidden_dim * 2, hidden_dim)
        
        # Cross-asset attention
        self.cross_asset_attention = AttentionBlock(hidden_dim)
        
        # Strategy-specific processing
        self.strategy_embedding = nn.Embedding(num_strategies, hidden_dim)
        
        # Risk tolerance processing
        self.risk_embedding = nn.Sequential(
            nn.Linear(1, hidden_dim // 2),
            nn.GELU(),
            nn.Linear(hidden_dim // 2, hidden_dim)
        )
        
        # Combined processing
        self.combined_layer = nn.Sequential(
            nn.Linear(hidden_dim * 3, hidden_dim * 2),
            nn.GELU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_dim * 2, hidden_dim),
            nn.GELU()
        )
        
        # Weight generator
        self.weight_generator = nn.Linear(hidden_dim, num_assets)
        
    def forward(self, 
                returns: torch.Tensor,
                features: torch.Tensor,
                mask: torch.Tensor, 
                strategy: torch.Tensor, 
                risk_tolerance: torch.Tensor):
        batch_size = returns.size(0)
        
        # Process each asset individually
        asset_embeddings = []
        for i in range(self.num_assets):
            # Extract data for this asset
            asset_returns = returns[:, :, i:i+1]  # [batch_size, window_size, 1]
            asset_features = features[:, :, i, :]  # [batch_size, window_size, feature_dim]
            
            # Encode asset data
            return_embedding = self.return_encoder(asset_returns)  # [batch_size, hidden_dim]
            feature_embedding = self.feature_encoder(asset_features)  # [batch_size, hidden_dim]
            
            # Combine embeddings
            asset_embedding = torch.cat([return_embedding, feature_embedding], dim=1)  # [batch_size, hidden_dim*2]
            asset_embedding = self.asset_combiner(asset_embedding)  # [batch_size, hidden_dim]
            
            asset_embeddings.append(asset_embedding)
        
        # Stack asset embeddings [batch_size, num_assets, hidden_dim]
        asset_embeddings = torch.stack(asset_embeddings, dim=1)
        
        # Apply cross-asset attention
        asset_embeddings = self.cross_asset_attention(asset_embeddings)
        
        # Process strategy - convert one-hot to index
        strategy_idx = torch.argmax(strategy, dim=1)
        strategy_embedding = self.strategy_embedding(strategy_idx)  # [batch_size, hidden_dim]
        
        # Process risk tolerance
        risk_embedding = self.risk_embedding(risk_tolerance)  # [batch_size, hidden_dim]
        
        # Combine strategy and risk embeddings
        context_embedding = torch.cat([
            strategy_embedding,
            risk_embedding
        ], dim=1)  # [batch_size, hidden_dim*2]
        
        # Pool asset embeddings with attention to mask
        # Apply mask to asset embeddings
        masked_embeddings = asset_embeddings * mask.unsqueeze(-1)
        
        # Sum pooling of masked embeddings
        pooled_embedding = masked_embeddings.sum(dim=1) / (mask.sum(dim=1, keepdim=True) + 1e-10)  # [batch_size, hidden_dim]
        
        # Combine pooled asset embedding with context
        combined = torch.cat([
            pooled_embedding,
            context_embedding
        ], dim=1)  # [batch_size, hidden_dim*3]
        
        # Process combined features
        hidden = self.combined_layer(combined)  # [batch_size, hidden_dim]
        
        # Generate unnormalized weights
        raw_weights = self.weight_generator(hidden)  # [batch_size, num_assets]
        
        # Apply mask and softmax to get normalized weights for active assets only
        masked_weights = raw_weights * mask - 1e10 * (1 - mask)
        normalized_weights = torch.softmax(masked_weights, dim=1)
        
        return normalized_weights


class PortfolioOptimizer:
    """Main class for portfolio optimization"""
    
    def __init__(self, 
                 model: nn.Module,
                 learning_rate: float = 1e-4,
                 device: str = 'cuda' if torch.cuda.is_available() else 'cpu'):
        """
        Initialize the optimizer
        
        Args:
            model: The portfolio optimization model
            learning_rate: Learning rate for training
            device: Device to use for training ('cuda' or 'cpu')
        """
        self.model = model.to(device)
        self.device = device
        self.optimizer = optim.Adam(model.parameters(), lr=learning_rate)
        
    def train(self, 
              train_loader: DataLoader, 
              val_loader: Optional[DataLoader] = None,
              num_epochs: int = 50,
              early_stopping_patience: int = 10):
        """
        Train the model
        
        Args:
            train_loader: DataLoader for training data
            val_loader: DataLoader for validation data
            num_epochs: Number of epochs to train for
            early_stopping_patience: Number of epochs to wait for validation loss improvement
        """
        best_val_loss = float('inf')
        patience_counter = 0
        train_losses = []
        val_losses = []
        
        for epoch in range(num_epochs):
            # Training
            self.model.train()
            train_loss = 0.0
            
            for batch in train_loader:
                # Move batch to device
                batch = {k: v.to(self.device) for k, v in batch.items()}
                
                # Forward pass
                predicted_weights = self.model(
                    batch['returns'],
                    batch['features'],
                    batch['mask'],
                    batch['strategy'],
                    batch['risk_tolerance']
                )
                
                # Calculate loss
                loss = self._calculate_loss(
                    predicted_weights,
                    batch['target_weights'],
                    batch['mask'],
                    batch['strategy']
                )
                
                # Backward pass and optimization
                self.optimizer.zero_grad()
                loss.backward()
                self.optimizer.step()
                
                train_loss += loss.item()
            
            train_loss /= len(train_loader)
            train_losses.append(train_loss)
            
            # Validation
            if val_loader is not None:
                val_loss = self.evaluate(val_loader)
                val_losses.append(val_loss)
                
                print(f"Epoch {epoch+1}/{num_epochs} - Train Loss: {train_loss:.6f}, Val Loss: {val_loss:.6f}")
                
                # Early stopping
                if val_loss < best_val_loss:
                    best_val_loss = val_loss
                    patience_counter = 0
                    # Save best model
                    torch.save(self.model.state_dict(), 'best_portfolio_model.pth')
                else:
                    patience_counter += 1
                    if patience_counter >= early_stopping_patience:
                        print(f"Early stopping at epoch {epoch+1}")
                        break
            else:
                print(f"Epoch {epoch+1}/{num_epochs} - Train Loss: {train_loss:.6f}")
        
        # Load best model if validation was used
        if val_loader is not None:
            self.model.load_state_dict(torch.load('best_portfolio_model.pth'))
            
        return train_losses, val_losses
    
    def evaluate(self, data_loader: DataLoader) -> float:
        """
        Evaluate the model
        
        Args:
            data_loader: DataLoader for evaluation data
            
        Returns:
            Average loss on the evaluation data
        """
        self.model.eval()
        total_loss = 0.0
        
        with torch.no_grad():
            for batch in data_loader:
                # Move batch to device
                batch = {k: v.to(self.device) for k, v in batch.items()}
                
                # Forward pass
                predicted_weights = self.model(
                    batch['returns'],
                    batch['features'],
                    batch['mask'],
                    batch['strategy'],
                    batch['risk_tolerance']
                )
                
                # Calculate loss
                loss = self._calculate_loss(
                    predicted_weights,
                    batch['target_weights'],
                    batch['mask'],
                    batch['strategy']
                )
                
                total_loss += loss.item()
        
        return total_loss / len(data_loader)
    
    def predict(self, 
                returns: np.ndarray,
                features: np.ndarray,
                active_tickers: List[str],
                strategy_idx: int = 0,
                risk_tolerance: int = 5) -> Dict[str, float]:
        """
        Generate portfolio weights for given input
        
        Args:
            returns: Historical returns array [window_size, num_assets]
            features: Features array [window_size, num_assets, feature_dim]
            active_tickers: List of tickers to include in the portfolio
            strategy_idx: Strategy index (0: Max Sharpe, 1: Min Vol, 2: ERC)
            risk_tolerance: Risk tolerance level (1-10)
            
        Returns:
            Dictionary mapping tickers to weights
        """
        self.model.eval()
        
        # Create mask based on active tickers
        all_tickers = TOP_STOCKS
        mask = np.zeros(len(all_tickers))
        for ticker in active_tickers:
            if ticker in all_tickers:
                idx = all_tickers.index(ticker)
                mask[idx] = 1
        
        # Prepare strategy one-hot encoding
        strategy_onehot = np.zeros(3)
        strategy_onehot[strategy_idx] = 1
        
        # Convert inputs to tensors and add batch dimension
        returns_tensor = torch.tensor(returns, dtype=torch.float32).unsqueeze(0).to(self.device)
        features_tensor = torch.tensor(features, dtype=torch.float32).unsqueeze(0).to(self.device)
        mask_tensor = torch.tensor(mask, dtype=torch.float32).unsqueeze(0).to(self.device)
        strategy_tensor = torch.tensor(strategy_onehot, dtype=torch.float32).unsqueeze(0).to(self.device)
        risk_tensor = torch.tensor([risk_tolerance/10.0], dtype=torch.float32).unsqueeze(0).to(self.device)
        
        # Generate weights
        with torch.no_grad():
            predicted_weights = self.model(
                returns_tensor,
                features_tensor,
                mask_tensor,
                strategy_tensor,
                risk_tensor
            )
        
        # Convert to numpy and remove batch dimension
        weights = predicted_weights.cpu().numpy()[0]
        
        # Create dictionary mapping tickers to weights
        portfolio = {}
        for i, ticker in enumerate(all_tickers):
            if mask[i] > 0 and weights[i] > 0.001:  # Only include assets with non-trivial weights
                portfolio[ticker] = weights[i]
        
        return portfolio
    
    def _calculate_loss(self, 
                        predicted_weights: torch.Tensor,
                        target_weights: torch.Tensor,
                        mask: torch.Tensor,
                        strategy: torch.Tensor) -> torch.Tensor:
        """
        Calculate the loss based on the optimization strategy
        
        Args:
            predicted_weights: Predicted portfolio weights
            target_weights: Target portfolio weights
            mask: Mask indicating active assets
            strategy: One-hot encoded strategy
            
        Returns:
            Loss value
        """
        # Mean squared error between predicted and target weights
        mse_loss = torch.mean(((predicted_weights - target_weights) ** 2) * mask)
        
        # Add regularization for weight concentration
        sum_squared = torch.sum(predicted_weights ** 2, dim=1)
        concentration_penalty = torch.mean(sum_squared)
        
        # Total loss
        loss = mse_loss + 0.01 * concentration_penalty
        
        return loss