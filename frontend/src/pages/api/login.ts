import type { APIRoute } from "astro";
import fs from "fs";
import path from "path";

const usersFile = path.join(process.cwd(), "src/data/users.json");

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    const { username, password } = await request.json();

    // Leer usuarios del archivo
    const users = JSON.parse(fs.readFileSync(usersFile, "utf-8"));

    const user = users.find(
        (u: any) => u.username === username && u.password === password
    );

    if (user) {
        return new Response(JSON.stringify({ success: true, ...user }), {
            status: 200,
        });
    }

    return new Response(
        JSON.stringify({ success: false, message: "Credenciales incorrectas" }),
        { status: 401 }
    );
};
