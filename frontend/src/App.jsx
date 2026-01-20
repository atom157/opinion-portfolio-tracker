import { useMemo, useState } from 'react';

const resolveApiBase = () => {
  if (process.env.REACT_APP_API_BASE) {
    return process.env.REACT_APP_API_BASE;
  }
  if (process.env.NODE_ENV === 'development') {
    return '';
  }
  return null;
};

const normalizeBase = (base) => (base ? base.replace(/\/+$/, '') : '');

const joinUrl = (base, path) => {
  if (!base) {
    return path;
  }
  const normalized = normalizeBase(base);
  return path.startsWith('/') ? `${normalized}${path}` : `${normalized}/${path}`;
};

export default function App() {
  const apiBase = useMemo(() => resolveApiBase(), []);
  const [status, setStatus] = useState('Idle');
  const [error, setError] = useState('');
  const [markets, setMarkets] = useState([]);
  const [total, setTotal] = useState(0);
  const [requestUrl, setRequestUrl] = useState('');

  const fetchMarkets = async () => {
    setStatus('Loading...');
    setError('');

    if (!apiBase && process.env.NODE_ENV !== 'development') {
      setStatus('Error');
      setError('REACT_APP_API_BASE is not set for production builds.');
      return;
    }

    const url = joinUrl(apiBase, '/api/markets?limit=20&page=1');
    setRequestUrl(url);

    try {
      const response = await fetch(url);
      const responseText = await response.text();
      let payload;
      try {
        payload = JSON.parse(responseText);
      } catch (parseError) {
        payload = { error: responseText };
      }

      if (!response.ok || !payload.ok) {
        console.error('Markets request failed:', response.status, payload);
        const message = payload.error || 'Failed to load markets';
        throw new Error(`HTTP ${response.status}: ${message}`);
      }

      setMarkets(payload.list || []);
      setTotal(payload.total || 0);
      setStatus('Loaded');
    } catch (err) {
      setStatus('Error');
      setError(err.message);
    }
  };

  return (
    <main style={{ fontFamily: 'Arial, sans-serif', padding: '32px' }}>
      <h1>Opinion Portfolio Tracker</h1>
      <p>Smoke UI: натисніть кнопку, щоб отримати список маркетів з API.</p>
      <button type="button" onClick={fetchMarkets} style={{ padding: '8px 16px' }}>
        Fetch markets
      </button>
      <p>Status: {status}</p>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {!error && status === 'Loaded' && (
        <p>Loaded {markets.length} markets (total: {total}).</p>
      )}
      <section style={{ marginTop: '24px', padding: '12px', border: '1px solid #ddd' }}>
        <h2>API status</h2>
        <p>Resolved API base: {apiBase || '(same-origin in dev)'}</p>
        <p>Last request URL: {requestUrl || '(none yet)'}</p>
      </section>
    </main>
  );
}
