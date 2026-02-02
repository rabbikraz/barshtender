export async function onRequestPost({ request, env }) {
    try {
        // 1. Check Auth (Reusing simple cookie check)
        const cookieHeader = request.headers.get("Cookie");
        if (!cookieHeader || !cookieHeader.includes("authorized=true")) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        const { id, status } = await request.json();

        if (!id || !status) {
            return new Response("Missing id or status", { status: 400 });
        }

        if (!env.DB) {
            return new Response("DB Not Configured", { status: 500 });
        }

        // 2. Update DB
        await env.DB.prepare(
            "UPDATE quotes SET status = ? WHERE id = ?"
        ).bind(status, id).run();

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
    }
}
