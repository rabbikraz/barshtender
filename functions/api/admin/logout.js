export async function onRequestPost({ request }) {
    // Clear the cookie
    return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
            "Content-Type": "application/json",
            "Set-Cookie": "authorized=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0"
        }
    });
}
