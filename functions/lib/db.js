// Idempotent table bootstrap. Called by endpoints that touch D1 so no
// manual migration is ever needed (locally or in production).

export async function ensureTables(env) {
    await env.DB.prepare(
        `CREATE TABLE IF NOT EXISTS quotes (
            id TEXT PRIMARY KEY,
            service_type TEXT,
            event_type TEXT,
            name TEXT,
            email TEXT,
            phone TEXT,
            event_date TEXT,
            guest_count INTEGER,
            location TEXT,
            message TEXT,
            created_at TEXT,
            status TEXT DEFAULT 'new'
        )`
    ).run();
    await env.DB.prepare(
        `CREATE TABLE IF NOT EXISTS menu_links (
            token TEXT PRIMARY KEY,
            quote_id TEXT NOT NULL,
            created_at TEXT,
            submitted_at TEXT,
            selection TEXT
        )`
    ).run();
}
