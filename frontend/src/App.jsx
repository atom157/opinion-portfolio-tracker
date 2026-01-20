import { useMemo, useState } from 'react';

const getApiBase = () => {
  if (process.env.REACT_APP_API_BASE) {
    return process.env.REACT_APP_API_BASE;
  }
  if (process.env.NODE_ENV === 'development') {
    return '';
  }
  return null;
};

export default function App() {
  const apiBase = useMemo(() => getApiBase(), []);
  const [status, setStatus] = useState('Idle');
  const [error, setError] = useState('');
  const [markets, setMarkets] = useState([]);
  const [total, setTotal] = useState(0);

  const fetchMarkets = async () => {
    setStatus('Loading...');
    setError('');

    if (!apiBase) {
      setStatus('Error');
      setError('REACT_APP_API_BASE is not set for production builds.');
      return;
    }

    try {
      const response = await fetch(`${apiBase}/api/markets?limit=20&page=1`);
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || 'Failed to load markets');
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
    </main>
  );
}
