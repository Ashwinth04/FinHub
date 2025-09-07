# Docker Setup - Monte Carlo Risk Engine 🐳

This is the **easiest way** to run the Monte Carlo Risk Engine without installing Visual Studio, CMake, or dealing with Windows build tools!

## Prerequisites

**Only Docker Desktop is required!**
- Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Make sure Docker Desktop is running (you'll see the Docker icon in your system tray)

## Super Quick Setup (2 commands!)

### For Windows:
```cmd
# 1. Run the setup script
docker-setup.bat

# That's it! The script will automatically open http://localhost:8000/docs
```

### For Mac/Linux:
```bash
# 1. Make script executable and run
chmod +x docker-setup.sh
./docker-setup.sh
```

### Manual Docker Commands:
```bash
# Build and start
docker-compose up -d

# Access Swagger UI at: http://localhost:8000/docs
```

## What You Get

After running the setup, you'll have:
- ✅ **Swagger UI**: http://localhost:8000/docs
- ✅ **API Root**: http://localhost:8000  
- ✅ **Health Check**: http://localhost:8000/health
- ✅ **High-performance C++ Monte Carlo engine** running in container
- ✅ **OpenMP parallelization** automatically configured
- ✅ **All dependencies** pre-installed in the container

## Testing the API

### 1. Open Swagger UI
Go to http://localhost:8000/docs in your browser

### 2. Try the Sample Portfolio
- Click `GET /sample-portfolio`
- Click "Try it out" → "Execute"
- You'll get a 3-asset sample portfolio

### 3. Calculate Risk
- Click `POST /calculate-risk`
- Click "Try it out"
- Paste this test data:
```json
{
  "assets": [
    {
      "asset_name": "AAPL",
      "weight": 0.6,
      "expected_return": 0.12,
      "volatility": 0.25
    },
    {
      "asset_name": "GOOGL",
      "weight": 0.4,
      "expected_return": 0.10,
      "volatility": 0.30
    }
  ],
  "num_simulations": 100000,
  "time_horizon_days": 1
}
```
- Click "Execute"
- You'll get VaR and CVaR calculations in ~50-200ms!

## Docker Commands Reference

```bash
# Start the service
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the service  
docker-compose down

# Restart
docker-compose restart

# Rebuild (after code changes)
docker-compose build --no-cache

# Check status
docker-compose ps

# Shell into container (for debugging)
docker-compose exec risk-engine bash
```

## Container Details

- **Base Image**: Python 3.11 slim (Ubuntu-based)
- **Build Tools**: GCC, CMake, OpenMP
- **Runtime**: Optimized production container
- **Security**: Runs as non-root user
- **Health Checks**: Automatic API health monitoring
- **Performance**: Multi-core OpenMP parallelization

## File Structure Needed

Make sure you have these files in your project directory:
```
risk-engine/
├── Dockerfile
├── docker-compose.yml
├── docker-setup.bat          # Windows setup script
├── docker-setup.sh           # Linux/Mac setup script  
├── requirements.txt
├── cpp/
│   ├── montecarlo.cpp
│   ├── montecarlo.h
│   ├── bindings.cpp
│   └── CMakeLists.txt
└── python/
    ├── main.py
    ├── risk_wrapper.py
    └── __init__.py
```

## Advantages of Docker Approach

✅ **No Visual Studio required**  
✅ **No CMake installation needed**  
✅ **No Windows build tools**  
✅ **Consistent environment** across all platforms  
✅ **Production-ready** deployment  
✅ **Easy scaling** and deployment  
✅ **Isolated dependencies**  
✅ **One-command setup**

## Performance

The Docker container automatically:
- Uses all available CPU cores via OpenMP
- Optimizes C++ compilation with `-O3 -march=native`
- Runs Monte Carlo simulations in parallel
- Typical performance: 100,000 simulations in 50-200ms

## Troubleshooting

### "Docker daemon not running"
- Start Docker Desktop from your Applications/Start Menu
- Wait for Docker to fully start (green icon in system tray)

### "Port 8000 already in use"
```bash
# Use different port
docker-compose -f docker-compose.yml up -d --build -p 8001:8000
```

### "Build failed"
```bash
# Clean rebuild
docker-compose down
docker system prune -f
docker-compose build --no-cache
```

### View detailed logs
```bash
docker-compose logs -f risk-engine
```

## Production Deployment

The setup includes production-ready features:
- Health checks
- Non-root user execution  
- Security best practices
- Optional Nginx reverse proxy
- Logging configuration
- Restart policies

For production, uncomment the nginx service in docker-compose.yml and configure SSL certificates.

---

**That's it! No Visual Studio, no complicated builds - just Docker and you're running Monte Carlo risk calculations in minutes! 🚀**