// POST /api/admin/send_menu_link
// Creates (or reuses) a personalized menu-builder token for a quote and
// emails the client a link to build their menu.
//
// Body: { id: quote id }

import { FONT, escapeHtml, mintButton, emailShell, sendViaResend, resendConfigured, isAuthorized, json } from "../../lib/email.js";
import { ensureTables } from "../../lib/db.js";

export async function onRequestPost({ request, env }) {
    try {
        if (!isAuthorized(request)) return json({ error: "Unauthorized" }, 401);
        if (!env.DB) return json({ error: "DB not configured" }, 500);
        if (!resendConfigured(env)) {
            return json({ error: "Email is not configured yet (set RESEND_API_KEY and FROM_EMAIL env vars)." }, 500);
        }

        const { id } = await request.json();
        if (!id) return json({ error: "Missing id" }, 400);

        const quote = await env.DB.prepare("SELECT * FROM quotes WHERE id = ?").bind(id).first();
        if (!quote) return json({ error: "Quote not found" }, 404);

        // Ensure tables exist (zero-ops migration)
        await ensureTables(env);

        // Reuse an existing link for this quote, or create one
        let link = await env.DB.prepare("SELECT * FROM menu_links WHERE quote_id = ? ORDER BY created_at DESC LIMIT 1").bind(id).first();
        if (!link) {
            const token = crypto.randomUUID().replace(/-/g, "");
            await env.DB.prepare("INSERT INTO menu_links (token, quote_id, created_at) VALUES (?, ?, ?)")
                .bind(token, id, new Date().toISOString()).run();
            link = { token: token };
        }

        const origin = new URL(request.url).origin;
        const url = origin + "/menu-builder?t=" + link.token;
        const firstName = (quote.name || "").trim().split(" ")[0];
        const adminEmail = env.ADMIN_EMAIL || "barshtender@gmail.com";

        const html = emailShell(
            "Design your menu",
            "Pick your pours, " + escapeHtml(firstName) + ".",
            '<p style="' + FONT + 'margin:0 0 18px;font-size:16px;line-height:1.6;color:#9b97b3;">Time for the fun part. We put together a personal menu builder for your event — browse the full drink list and choose either:</p>' +
            '<p style="' + FONT + 'margin:0;padding:14px 0;border-top:1px solid #2e2a44;border-bottom:1px solid #221d35;font-size:15px;font-weight:700;color:#f2eee8;">4 cocktails &nbsp;+&nbsp; 1 mocktail</p>' +
            '<p style="' + FONT + 'margin:0 0 4px;padding:14px 0;border-bottom:1px solid #2e2a44;font-size:15px;font-weight:700;color:#f2eee8;">3 cocktails &nbsp;+&nbsp; 2 mocktails</p>' +
            '<p style="' + FONT + 'margin:18px 0 0;font-size:15px;line-height:1.6;color:#9b97b3;">Have something in mind that isn\'t on the list? You can add your own — we will build it.</p>' +
            mintButton(url, "Build my menu") +
            '<p style="' + FONT + 'margin:24px 0 0;font-size:13px;line-height:1.6;color:#6f6b85;">This link is personal to your event. If the button doesn\'t work, copy this address:<br><a href="' + url + '" style="color:#8b88a0;">' + url + '</a></p>'
        );

        const text =
            "Hi " + quote.name + ",\n\n" +
            "Time for the fun part - build the drink menu for your event!\n\n" +
            "Choose either 4 cocktails + 1 mocktail, or 3 cocktails + 2 mocktails. " +
            "And if you have something in mind that isn't on the list, you can add your own.\n\n" +
            "Build your menu here: " + url + "\n\n" +
            "L'chaim,\nThe Barshtender Team";

        await sendViaResend(env, {
            from: env.FROM_EMAIL,
            to: [quote.email],
            reply_to: adminEmail,
            subject: "Build your drink menu — Barshtender",
            html: html,
            text: text
        });

        return json({ success: true, url: url });

    } catch (err) {
        console.error(err);
        return json({ error: "Failed to send: " + err.message }, 500);
    }
}
