// POST /api/admin/delete
// Permanently deletes a quote and any menu links tied to it.
//
// Body: { id: quote id }

import { isAuthorized, json } from "../../lib/email.js";

export async function onRequestPost({ request, env }) {
    try {
        if (!isAuthorized(request)) return json({ error: "Unauthorized" }, 401);
        if (!env.DB) return json({ error: "DB not configured" }, 500);

        const { id } = await request.json();
        if (!id) return json({ error: "Missing id" }, 400);

        try {
            await env.DB.prepare("DELETE FROM menu_links WHERE quote_id = ?").bind(id).run();
        } catch (e) {
            // menu_links table may not exist yet; the quote delete still proceeds
        }
        await env.DB.prepare("DELETE FROM quotes WHERE id = ?").bind(id).run();

        return json({ success: true });
    } catch (err) {
        console.error(err);
        return json({ error: "Server error" }, 500);
    }
}
