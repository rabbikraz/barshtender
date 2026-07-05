export async function onRequestPost({ request, env }) {
    try {
        const { username, password } = await request.json();

        // Credentials come from env vars when set (Cloudflare Pages >
        // Settings > Environment variables: ADMIN_USER / ADMIN_PASSWORD).
        // Falls back to the legacy hardcoded pair until those are set.
        const validUser = env.ADMIN_USER || "admin";
        const validPassword = env.ADMIN_PASSWORD || "admin123";

        if (username === validUser && password === validPassword) {

            // Create a simple session cookie
            const cookieValue = "authorized=true; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400"; // 24 hours

            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Set-Cookie": cookieValue
                }
            });
        }

        return new Response(JSON.stringify({ error: "Invalid credentials" }), {
            status: 401,
            headers: { "Content-Type": "application/json" }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
    }
}
