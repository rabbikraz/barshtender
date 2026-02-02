export async function onRequestPost({ request, env }) {
    try {
        const { username, password } = await request.json();

        // Hardcoded credentials as requested (admin / admin123)
        // Ideally this should be in Environment Variables
        if (username === "admin" && password === "admin123") {

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
