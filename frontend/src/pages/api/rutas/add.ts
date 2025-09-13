import type { APIRoute } from "astro";
import fs from "fs";
import path from "path";

export const prerender = false;
const rutasFile = path.join(process.cwd(), "src/data/rutas.json");

interface Ruta {
    id: string;
    label: string;
    type: string;
    color: string;
    points: number[][];
    stops?: { coordenas: number[]; nombre: string }[];
    images?: string[];
}

export const POST: APIRoute = async ({ request }) => {
    try {
        const newRuta: Ruta = await request.json();

        let rutas: Ruta[] = [];
        if (fs.existsSync(rutasFile)) {
            const data = fs.readFileSync(rutasFile, "utf-8");
            rutas = JSON.parse(data);
        }

        rutas.push(newRuta);
        fs.writeFileSync(rutasFile, JSON.stringify(rutas, null, 2));

        return new Response(JSON.stringify({ success: true, ruta: newRuta }), {
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
