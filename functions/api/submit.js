export async function onRequestPost({ request, env }) {
    try {
        const data = await request.json();

        // Validate required fields
        if (!data.name || !data.email || !data.serviceType) {
            return new Response(JSON.stringify({ error: "Missing required fields" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const API_KEY = env.RESEND_API_KEY || "re_ZhDRyiWr_Hk6AZus9aGofaaYf9awG6puu";

        // 0. Save to D1 Database (if available)
        let dbSaveError = null;
        if (env.DB) {
            try {
                const id = crypto.randomUUID();
                const createdAt = new Date().toISOString();

                await env.DB.prepare(`
          INSERT INTO quotes (id, service_type, event_type, name, email, phone, event_date, guest_count, location, message, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
                    id,
                    data.serviceType,
                    data.eventType || null,
                    data.name,
                    data.email,
                    data.phone || null,
                    data.eventDate,
                    data.guestCount || null,
                    data.location || null,
                    data.message || null,
                    createdAt
                ).run();

            } catch (dbErr) {
                console.error("Failed to save to D1 database:", dbErr);
                dbSaveError = dbErr.message;
            }
        } else {
            console.warn("DB binding not found. Skipping database save.");
        }

        // 1. Forward to Google Apps Script (Handles Emails & Sheets)
        // This allows emails to be sent from 'barshtender@gmail.com' and saves to Sheets
        const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwt7l5cYb25T-GDilDse-afYKPHFXy9WGQGc5MloFs9asl_8QaB-4KEOACBPLKja974zA/exec";

        try {
            await fetch(GOOGLE_SCRIPT_URL, {
                method: "POST",
                body: JSON.stringify(data),
                headers: { "Content-Type": "application/json" }
            });
        } catch (gsErr) {
            console.error("Failed to forward to Google Script:", gsErr);
            // We don't throw here because we still want to return success if DB save worked
        }

        return new Response(JSON.stringify({
            status: "success",
            message: "Quote request processed",
            debug_db: dbSaveError ? "DB Save Failed" : "DB Saved"
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ status: "error", message: "Internal Server Error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
