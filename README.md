# 🚀 Інструкція з деплою Opinion Portfolio Tracker

## Структура проекту

```
opinion-portfolio-tracker/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env
│   ├── .env.example
│   └── railway.json
├── frontend/
│   ├── src/
│   │   └── App.jsx
│   ├── package.json
│   └── vercel.json
├── railway.json
└── README.md
```

## 📦 Крок 1: Підготовка GitHub Repository

### 1.1 Створіть новий репозиторій на GitHub

```bash
# На GitHub створіть новий репозиторій: opinion-portfolio-tracker
```

### 1.2 Ініціалізуйте локальний проект

```bash
# Створіть папку проекту
mkdir opinion-portfolio-tracker
cd opinion-portfolio-tracker

# Ініціалізуйте git
git init
```

### 1.3 Створіть структуру папок

```bash
# Backend
mkdir backend
cd backend

# Створіть файли backend (скопіюйте з артефактів):
# - server.js
# - package.json
# - railway.json
# - .env (не додавайте в git!)
# - .env.example

# Встановіть залежності
npm install

cd ..

# Frontend
mkdir frontend
cd frontend

# Створіть React проект
npx create-react-app .
# Або скопіюйте готовий код фронтенду
```

### 1.3.1 Налаштуйте Railway для монорепозиторію

Railway за замовчуванням шукає `package.json` у корені репозиторію. У цьому проєкті він знаходиться в `backend/`, тож потрібно вказати кореневу директорію для білда. Для цього в корені репозиторію створіть `railway.json` з параметром `rootDirectory`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "rootDirectory": "backend",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node server.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 1.4 Створіть .gitignore

```bash
# В корені проекту створіть .gitignore:
cat > .gitignore << EOF
# Dependencies
node_modules/
.pnp
.pnp.js

# Environment variables
.env
.env.local
.env.production

# Build
build/
dist/

# Misc
.DS_Store
*.log
npm-debug.log*
EOF
```

### 1.5 Закомітьте та запушіть

```bash
git add .
git commit -m "Initial commit: Opinion Portfolio Tracker"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/opinion-portfolio-tracker.git
git push -u origin main
```

## Backend: server.js

```javascript
const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Opinion API configuration
const OPINION_API_BASE = 'https://openapi.opinion.trade/openapi';
const API_KEY = process.env.OPINION_API_KEY || 'ehtBldzeqaB88gW0YeWcz6ku5M2R9KO8';

// Helper function to make Opinion API requests
async function opinionRequest(endpoint) {
  try {
    const response = await axios.get(`${OPINION_API_BASE}${endpoint}`, {
      headers: {
        apikey: API_KEY,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Opinion API Error:', error.message);
    throw error;
  }
}

// Routes

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Opinion Portfolio Tracker API',
    version: '1.0.0',
  });
});

// Get user positions
app.get('/api/positions/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const limit = req.query.limit || 20;

    const data = await opinionRequest(`/positions/user/${walletAddress}?limit=${limit}`);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch positions',
      message: error.message,
    });
  }
});

// Get user trades
app.get('/api/trades/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const limit = req.query.limit || 50;

    const data = await opinionRequest(`/trade/user/${walletAddress}?limit=${limit}`);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch trades',
      message: error.message,
    });
  }
});

// Get market data
app.get('/api/markets', async (req, res) => {
  try {
    const data = await opinionRequest('/markets');
    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch markets',
      message: error.message,
    });
  }
});

// Get user balance
app.get('/api/balance/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;

    const data = await opinionRequest(`/balance/user/${walletAddress}`);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch balance',
      message: error.message,
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Opinion Portfolio Tracker API running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/`);
});

module.exports = app;
```

## Backend: package.json

```json
{
  "name": "opinion-portfolio-tracker-backend",
  "version": "1.0.0",
  "description": "Backend API for Opinion Portfolio Tracker",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [
    "opinion",
    "portfolio",
    "tracker",
    "crypto",
    "trading"
  ],
  "author": "Opinion Builders",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "axios": "^1.6.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

## Backend: .env.example

```bash
# Opinion API Configuration
OPINION_API_KEY=ehtBldzeqaB88gW0YeWcz6ku5M2R9KO8

# Server Configuration
PORT=3001

# CORS Configuration (optional - for production)
ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend-domain.vercel.app
```

## Backend: railway.json

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node server.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```
