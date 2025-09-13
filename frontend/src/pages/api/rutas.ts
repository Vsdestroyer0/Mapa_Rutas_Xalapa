import type { APIRoute } from "astro";
import fs from "fs";
import path from "path";

export const prerender = false;

const rutasFile = path.join(process.cwd(), "src/data/rutas.json");

export const GET: APIRoute = async () => {
    try {
        const data = fs.readFileSync(rutasFile, "utf-8");
        const rutas = JSON.parse(data);
        return new Response(JSON.stringify(rutas), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: "No se pudo leer rutas" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
