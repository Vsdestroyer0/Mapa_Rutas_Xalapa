import type { APIRoute } from "astro";
import fs from "fs";
import path from "path";

export const prerender = false;
const rutasFile = path.join(process.cwd(), "src/data/rutas.json");

export const POST: APIRoute = async ({ request }) => {
    try {
        const { id } = await request.json();

        let rutas: any[] = [];
        if (fs.existsSync(rutasFile)) {
            rutas = JSON.parse(fs.readFileSync(rutasFile, "utf-8"));
        }

        rutas = rutas.filter(r => r.id !== id);
        fs.writeFileSync(rutasFile, JSON.stringify(rutas, null, 2));

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err instanceof Error ? err.message : err }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
