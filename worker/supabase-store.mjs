const tableName = "ttang_snapshots";

function readConfig() {
  return {
    url: String(process.env.SUPABASE_URL || "").replace(/\/+$/, ""),
    serviceKey: String(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || ""),
    readKey: String(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY || ""),
  };
}

export function isSupabaseReadConfigured() {
  const config = readConfig();
  return Boolean(config.url && config.readKey);
}

export function isSupabaseWriteConfigured() {
  const config = readConfig();
  return Boolean(config.url && config.serviceKey);
}

async function request(path, options = {}, key) {
  const config = readConfig();
  if (!config.url || !key) return null;

  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Supabase ${response.status}: ${message.slice(0, 500)}`);
  }
  return response;
}

export async function saveSnapshot(snapshotKey, payload) {
  const config = readConfig();
  if (!config.url || !config.serviceKey) return false;

  await request(tableName, {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify([{
      snapshot_key: snapshotKey,
      payload,
      updated_at: new Date().toISOString(),
    }]),
  }, config.serviceKey);
  return true;
}

export async function readSnapshot(snapshotKey) {
  const config = readConfig();
  if (!config.url || !config.readKey) return null;

  const query = `?select=payload,updated_at&snapshot_key=eq.${encodeURIComponent(snapshotKey)}&limit=1`;
  const response = await request(`${tableName}${query}`, {}, config.readKey);
  const rows = await response.json();
  return rows[0]?.payload || null;
}
