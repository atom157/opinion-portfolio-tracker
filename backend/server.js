const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const MARKET_CACHE_TTL_MS = 30 * 1000;
const MARKET_MAX_RETRIES = 2;
const MARKET_TIMEOUT_MS = 8000;

// Middleware
const frontendOrigins = (process.env.FRONTEND_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const isDev = process.env.NODE_ENV !== 'production';

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (frontendOrigins.includes(origin)) {
        return callback(null, true);
      }

      if (isDev && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'), false);
    },
  }),
);
app.use(express.json());

// Opinion API configuration
const OPINION_API_BASE = 'https://openapi.opinion.trade/openapi';
const API_KEY = process.env.OPINION_API_KEY || 'ehtBldzeqaB88gW0YeWcz6ku5M2R9KO8';

const opinionClient = axios.create({
  baseURL: OPINION_API_BASE,
  timeout: MARKET_TIMEOUT_MS,
  headers: {
    apikey: API_KEY,
    'Content-Type': 'application/json',
  },
});

function buildErrorResponse(error, statusCode = 500) {
  const payload = {
    ok: false,
    error: error?.message || 'Unexpected error',
  };

  if (statusCode) {
    payload.status = statusCode;
  }

  if (error?.response?.data) {
    payload.upstream = error.response.data;
  }

  return payload;
}

// Helper function to make Opinion API requests with retries
async function opinionRequest(endpoint, { retries = MARKET_MAX_RETRIES } = {}) {
  try {
    const response = await opinionClient.get(endpoint);
    return response.data;
  } catch (error) {
    const status = error?.response?.status;
    const shouldRetry = retries > 0 && (status === 429 || (status >= 500 && status < 600));
    if (shouldRetry) {
      const delayMs = (MARKET_MAX_RETRIES - retries + 1) * 500;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return opinionRequest(endpoint, { retries: retries - 1 });
    }
    console.error('Opinion API Error:', error.message);
    throw error;
  }
}

const marketsCache = new Map();

function getCachedMarkets(cacheKey) {
  const cached = marketsCache.get(cacheKey);
  if (!cached) {
    return null;
  }
  if (Date.now() > cached.expiresAt) {
    marketsCache.delete(cacheKey);
    return null;
  }
  return cached.value;
}

function setCachedMarkets(cacheKey, value) {
  marketsCache.set(cacheKey, { value, expiresAt: Date.now() + MARKET_CACHE_TTL_MS });
}

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// Get user positions
app.get('/api/positions/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const limit = req.query.limit || 20;

    const data = await opinionRequest(`/positions/user/${walletAddress}?limit=${limit}`);
    res.json({ ok: true, data });
  } catch (error) {
    const status = error?.response?.status || 502;
    res.status(status).json(buildErrorResponse(error, status));
  }
});

// Get user trades
app.get('/api/trades/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const limit = req.query.limit || 50;

    const data = await opinionRequest(`/trade/user/${walletAddress}?limit=${limit}`);
    res.json({ ok: true, data });
  } catch (error) {
    const status = error?.response?.status || 502;
    res.status(status).json(buildErrorResponse(error, status));
  }
});

// Get market data
app.get('/api/markets', async (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit, 10) || 20;
    const page = Number.parseInt(req.query.page, 10) || 1;

    if (limit <= 0 || page <= 0) {
      return res.status(400).json(buildErrorResponse(new Error('Invalid pagination params'), 400));
    }

    const cacheKey = `${limit}:${page}`;
    const cached = getCachedMarkets(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const data = await opinionRequest(`/markets?limit=${limit}&page=${page}`);
    let list = [];
    let total = 0;

    if (Array.isArray(data)) {
      list = data;
      total = data.length;
    } else if (Array.isArray(data?.list)) {
      list = data.list;
      total = data.total ?? data.list.length;
    } else if (Array.isArray(data?.data)) {
      list = data.data;
      total = data.total ?? data.data.length;
    }

    const payload = { ok: true, total, list };
    setCachedMarkets(cacheKey, payload);
    res.json(payload);
  } catch (error) {
    const status = error?.response?.status || 502;
    res.status(status).json(buildErrorResponse(error, status));
  }
});

// Get user balance
app.get('/api/balance/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;

    const data = await opinionRequest(`/balance/user/${walletAddress}`);
    res.json({ ok: true, data });
  } catch (error) {
    const status = error?.response?.status || 502;
    res.status(status).json(buildErrorResponse(error, status));
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json(buildErrorResponse(err, 500));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Opinion Portfolio Tracker API running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/`);
});

module.exports = app;
