// Public menu-builder endpoints (token-authenticated, no admin session).
//
// GET  /api/menu?t=TOKEN
//   -> { name, eventDate, submitted, selection }
//
// POST /api/menu
//   Body: { token, package: "4-1" | "3-2", cocktails: [..], mocktails: [..] }
//   Validates the package counts (custom typed-in drinks count too),
//   saves the selection, and notifies the admin by email.

import { FONT, escapeHtml, detailRow, emailShell, sendViaResend, resendConfigured, json } from "../lib/email.js";
import { ensureTables } from "../lib/db.js";

async function findLink(env, token) {
    await ensureTables(env);
    return env.DB.prepare(
        `SELECT m.*, q.name, q.email, q.event_date, q.event_type, q.guest_count
         FROM menu_links m JOIN quotes q ON q.id = m.quote_id
         WHERE m.token = ?`
    ).bind(token).first();
}

export async function onRequestGet({ request, env }) {
    try {
        if (!env.DB) return json({ error: "Not available" }, 500);
        const token = new URL(request.url).searchParams.get("t") || "";
        if (!token) return json({ error: "Missing token" }, 400);

        const link = await findLink(env, token);
        if (!link) return json({ error: "This link is not valid." }, 404);

        return json({
            name: (link.name || "").trim().split(" ")[0],
            eventDate: link.event_date || "",
            submitted: Boolean(link.submitted_at),
            selection: link.selection ? JSON.parse(link.selection) : null
        });
    } catch (err) {
        console.error(err);
        return json({ error: "Server error" }, 500);
    }
}

export async function onRequestPost({ request, env }) {
    try {
        if (!env.DB) return json({ error: "Not available" }, 500);
        const body = await request.json();
        const token = body.token || "";
        const pkg = body.package;
        const cocktails = Array.isArray(body.cocktails) ? body.cocktails.map(String).map(function (s) { return s.trim(); }).filter(Boolean) : [];
        const mocktails = Array.isArray(body.mocktails) ? body.mocktails.map(String).map(function (s) { return s.trim(); }).filter(Boolean) : [];

        if (!token) return json({ error: "Missing token" }, 400);

        const limits = pkg === "4-1" ? { c: 4, m: 1 } : pkg === "3-2" ? { c: 3, m: 2 } : null;
        if (!limits) return json({ error: "Pick a package first." }, 400);
        if (cocktails.length !== limits.c || mocktails.length !== limits.m) {
            return json({ error: "Please choose exactly " + limits.c + " cocktails and " + limits.m + " mocktail" + (limits.m > 1 ? "s" : "") + "." }, 400);
        }
        if (cocktails.some(function (s) { return s.length > 80; }) || mocktails.some(function (s) { return s.length > 80; })) {
            return json({ error: "Drink names must be under 80 characters." }, 400);
        }

        const link = await findLink(env, token);
        if (!link) return json({ error: "This link is not valid." }, 404);

        const selection = { package: pkg, cocktails: cocktails, mocktails: mocktails };
        await env.DB.prepare("UPDATE menu_links SET selection = ?, submitted_at = ? WHERE token = ?")
            .bind(JSON.stringify(selection), new Date().toISOString(), token).run();

        // Notify admin (best effort)
        if (resendConfigured(env)) {
            try {
                const adminEmail = env.ADMIN_EMAIL || "barshtender@gmail.com";
                const listBlock = function (title, items) {
                    return '<p style="' + FONT + 'margin:22px 0 6px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#6f6b85;">' + title + '</p>' +
                        items.map(function (item, i) {
                            const border = i < items.length - 1 ? "border-bottom:1px solid #221d35;" : "";
                            return '<p style="' + FONT + 'margin:0;padding:10px 0;' + border + 'font-size:15px;font-weight:600;color:#f2eee8;">' + escapeHtml(item) + '</p>';
                        }).join("");
                };

                const html = emailShell(
                    "Menu submitted",
                    escapeHtml((link.name || "").trim().split(" ")[0]) + " picked their pours.",
                    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #2e2a44;">' +
                    detailRow("Client", link.name) +
                    detailRow("Event date", link.event_date) +
                    detailRow("Guests", link.guest_count) +
                    detailRow("Package", pkg === "4-1" ? "4 cocktails + 1 mocktail" : "3 cocktails + 2 mocktails") +
                    '</table>' +
                    listBlock("Cocktails", cocktails) +
                    listBlock("Mocktails", mocktails)
                );

                await sendViaResend(env, {
                    from: env.FROM_EMAIL,
                    to: [adminEmail],
                    reply_to: link.email,
                    subject: "Menu submitted: " + link.name,
                    html: html,
                    text: "Menu submitted by " + link.name + "\n\nPackage: " + pkg + "\nCocktails: " + cocktails.join(", ") + "\nMocktails: " + mocktails.join(", ")
                });
            } catch (mailErr) {
                console.error("Menu notify failed:", mailErr);
            }
        }

        return json({ success: true });

    } catch (err) {
        console.error(err);
        return json({ error: "Server error" }, 500);
    }
}
