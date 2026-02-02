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

        // 2. Prepare Client Confirmation Email
        const whatsappMessage = encodeURIComponent("Hi, I would like to get a quote for your services.");
        const whatsappLink = `https://wa.me/13393648770?text=${whatsappMessage}`;

        const clientHtmlBody = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Hi ${data.name},</h2>
        
        <p>Thank you for contacting Barshtender! We have received your request for a <strong>${data.serviceType === 'bar-services' ? 'Bar at your event' : 'Cocktail Workshop'}</strong>.</p>
        
        <h3>Here is a summary of what you requested:</h3>
        <ul>
          <li><strong>Service:</strong> ${data.serviceType === 'bar-services' ? 'Bar Services' : 'Cocktail Workshop'}</li>
          ${data.eventType ? `<li><strong>Event Type:</strong> ${data.eventType}</li>` : ''}
          <li><strong>Date:</strong> ${data.eventDate}</li>
          <li><strong>Location:</strong> ${data.location || 'TBD'}</li>
          <li><strong>Guests:</strong> ${data.guestCount || 'TBD'}</li>
        </ul>
        
        <p>We will review your details and get back to you as soon as possible.</p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        
        <p style="font-size: 0.9em; color: #666;">
          If we do not get back to you in the next 24 hours, please feel free to reach out to us on WhatsApp: 
          <br>
          <a href="${whatsappLink}" style="display: inline-block; background-color: #25D366; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px; font-weight: bold;">
            Chat on WhatsApp
          </a>
          <br>
          or click here: <a href="${whatsappLink}">${whatsappLink}</a>
        </p>
        
        <p>Cheers,<br>The Barshtender Team</p>
      </div>
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
                    subject: "We received your quote request! - Barshtender",
                    html: clientHtmlBody,
                }),
            });

            if (!clientEmailRes.ok) {
                console.warn("Client confirmation email failed (Expected in Testing Mode if target is not verified):", await clientEmailRes.text());
            }
        } catch (clientErr) {
            console.warn("Could not send client email:", clientErr);
        }

        return new Response(JSON.stringify({ status: "success", message: "Quote request sent successfully" }), {
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
