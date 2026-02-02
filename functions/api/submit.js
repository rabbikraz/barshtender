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

        // 1. Send Email to Admin (Barshtender)
        const adminEmailContent = `
      New quote request received:
      
      Service Type: ${data.serviceType}
      Event Type: ${data.eventType || "N/A"}
      Name: ${data.name}
      Email: ${data.email}
      Phone: ${data.phone}
      Event Date: ${data.eventDate}
      Guests: ${data.guestCount}
      Location: ${data.location}
      Message: ${data.message}
    `;

        // We will use Resend (or any SMTP/API provider)
        // using the provided key as fallback
        const API_KEY = env.RESEND_API_KEY || "re_ZhDRyiWr_Hk6AZus9aGofaaYf9awG6puu";

        if (!API_KEY) {
            console.error("RESEND_API_KEY is missing");
            return new Response(JSON.stringify({
                status: "error",
                message: "Server configuration error: Missing Email API Key."
            }), { status: 500 });
        }

        const adminEmailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: "onboarding@resend.dev", // Using testing domain to ensure delivery without DNS setup
                to: ["barshtender@gmail.com"],
                subject: `New Quote Request from ${data.name}`,
                text: adminEmailContent,
            }),
        });

        if (!adminEmailRes.ok) {
            const errorText = await adminEmailRes.text();
            console.error("Failed to send admin email:", errorText);
            throw new Error("Failed to send email");
        }

        // 2. Prepare Client Confirmation Email (HTML Template)
        const whatsappMessage = encodeURIComponent("Hi, I would like to get a quote for your services.");
        const whatsappLink = `https://wa.me/13393648770?text=${whatsappMessage}`;

        const clientHtmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #2d3a5c; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
          .header { background: #2d3a5c; padding: 30px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-family: 'Georgia', serif; letter-spacing: 2px; }
          .content { padding: 40px 30px; }
          .greeting { font-size: 20px; font-weight: bold; margin-bottom: 20px; color: #3d4b7a; }
          .card { background: #f8fafc; border-left: 4px solid #b8ccb2; padding: 20px; margin: 20px 0; border-radius: 4px; }
          .card ul { list-style: none; padding: 0; margin: 0; }
          .card li { margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #eef2f6; }
          .card li:last-child { border-bottom: none; }
          .card strong { color: #3d4b7a; display: inline-block; width: 120px; }
          .btn { display: inline-block; background: #25D366; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 50px; font-weight: bold; margin-top: 20px; text-align: center; }
          .footer { background: #eef2f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7a9a; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #ffffff; text-transform: uppercase; font-family: 'Playfair Display', Georgia, serif;">Barshtender</div>
            <div style="color: #b8ccb2; font-size: 14px; letter-spacing: 1px; margin-top: 5px;">KOSHER COCKTAILS, REIMAGINED</div>
          </div>
          <div class="content">
            <div class="greeting">Hi ${data.name},</div>
            <p>Thank you for choosing Barshtender! We have successfully received your request for a <strong>${data.serviceType === 'bar-services' ? 'Bar Event' : 'Cocktail Workshop'}</strong>.</p>
            
            <p>Our team is reviewing your details and will craft a custom proposal for you shortly.</p>
            
            <div class="card">
              <h3>Request Details</h3>
              <ul>
                <li><strong>Service:</strong> ${data.serviceType === 'bar-services' ? 'Bar Services' : 'Cocktail Workshop'}</li>
                ${data.eventType ? `<li><strong>Event Type:</strong> ${data.eventType}</li>` : ''}
                <li><strong>Date:</strong> ${data.eventDate}</li>
                <li><strong>Location:</strong> ${data.location || 'TBD'}</li>
                <li><strong>Guests:</strong> ${data.guestCount || 'TBD'}</li>
              </ul>
            </div>
            
            <p style="font-size: 14px; color: #666;">We typically respond within 24 hours. If you need an immediate response or have specific questions, please chat with us directly:</p>
            
            <center>
              <a href="${whatsappLink}" class="btn">
                Chat on WhatsApp
              </a>
            </center>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Barshtender. Kosher Cocktails, Reimagined.<br>
            <a href="https://barshtender.com" style="color: #3d4b7a; text-decoration: none;">www.barshtender.com</a>
          </div>
        </div>
      </body>
      </html>
    `;

        // 3. Send Confirmation Email to Client
        // Note: In Resend "Testing" mode, you can ONLY send to the email address you signed up with.
        // Sending to the client's email will likely fail until you verify the domain 'barshtender.com' in Resend.
        // We wrap this in a try/catch so the user still gets a "Success" message even if this specific email fails during testing.
        try {
            const clientEmailRes = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    from: "onboarding@resend.dev",
                    to: [data.email],
                    reply_to: "barshtender@gmail.com",
                    subject: "We received your quote request - Barshtender",
                    html: clientHtmlBody,
                }),
            });

            if (!clientEmailRes.ok) {
                console.warn("Client confirmation email failed (Expected in Testing Mode if target is not verified):", await clientEmailRes.text());
            }
        } catch (clientErr) {
            console.warn("Could not send client email:", clientErr);
        }

        return new Response(JSON.stringify({
            status: "success",
            message: "Quote request sent successfully",
            debug_db: dbSaveError ? "DB Save Failed: " + dbSaveError : "DB Saved" // Return DB status to client for debugging
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
