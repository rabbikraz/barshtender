export async function onRequestGet({ request, env }) {
    // 1. Check Auth Cookie
    const cookieHeader = request.headers.get("Cookie");
    if (!cookieHeader || !cookieHeader.includes("authorized=true")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" }
        });
    }

    // 2. Fetch from D1 Database
    try {
        if (!env.DB) {
            // Graceful fallback if DB is not set up yet
            // Return empty list so admin panel loads but shows nothing
            return new Response(JSON.stringify([]), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            });
        }

        const { results } = await env.DB.prepare(
            "SELECT * FROM quotes ORDER BY created_at DESC"
        ).all();

        return new Response(JSON.stringify(results), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Database error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
