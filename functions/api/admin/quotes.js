import { isAuthorized, json } from "../../lib/email.js";
import { ensureTables } from "../../lib/db.js";

export async function onRequestGet({ request, env }) {
    if (!isAuthorized(request)) return json({ error: "Unauthorized" }, 401);

    try {
        if (!env.DB) {
            // Graceful fallback if DB is not set up yet
            return json([]);
        }

        // Ensure tables exist so the join below never fails
        await ensureTables(env);

        const { results } = await env.DB.prepare(
            `SELECT q.*, m.token AS menu_token, m.submitted_at AS menu_submitted_at, m.selection AS menu_selection
             FROM quotes q
             LEFT JOIN menu_links m ON m.quote_id = q.id
             ORDER BY q.created_at DESC`
        ).all();

        return json(results);

    } catch (err) {
        console.error(err);
        return json({ error: "Database error" }, 500);
    }
}
