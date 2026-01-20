const apiBase = process.env.API_BASE || `http://localhost:${process.env.PORT || 3001}`;

async function run() {
  const healthRes = await fetch(`${apiBase}/health`);
  const healthJson = await healthRes.json();

  const marketsRes = await fetch(`${apiBase}/api/markets?limit=20&page=1`);
  const marketsJson = await marketsRes.json();

  console.log('Health status:', healthRes.status, healthJson);
  console.log('Markets status:', marketsRes.status, {
    ok: marketsJson.ok,
    total: marketsJson.total,
    listLength: Array.isArray(marketsJson.list) ? marketsJson.list.length : null,
  });
}

run().catch((error) => {
  console.error('Smoke test failed:', error);
  process.exit(1);
});
