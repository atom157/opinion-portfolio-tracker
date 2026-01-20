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

// Basic landing page
app.get('/', (req, res) => {
  res.type('html').send(`<!doctype html>
<html lang="uk">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Opinion Portfolio Tracker</title>
    <style>
      body { font-family: Arial, sans-serif; background: #0f1115; color: #f5f5f5; margin: 0; }
      main { max-width: 720px; margin: 48px auto; padding: 0 16px; }
      a { color: #7dd3fc; }
      code { background: #1f2937; padding: 2px 6px; border-radius: 4px; }
    </style>
  </head>
  <body>
    <main>
      <h1>Opinion Portfolio Tracker</h1>
      <p>Це бекенд API. Для сайту потрібен окремий фронтенд-деплой (Vercel/Netlify).</p>
      <p>Health-check: <a href="/api/health"><code>/api/health</code></a></p>
    </main>
  </body>
</html>`);
});

// Health check
app.get('/api/health', (req, res) => {
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
