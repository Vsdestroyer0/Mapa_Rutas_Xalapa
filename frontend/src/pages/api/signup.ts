// src/pages/api/signup.ts
import fs from "fs";
import path from "path";

export const prerender = false;

const usersFile = path.resolve("src/data/users.json");

interface User {
    username: string;
    password: string;
    role: string;
}

export const POST = async ({ request }: { request: Request }) => {
    try {
        const body = (await request.json()) as {
            username: string;
            password: string;
        };

        // Leer usuarios existentes
        let users: User[] = [];
        if (fs.existsSync(usersFile)) {
            const data = fs.readFileSync(usersFile, "utf-8");
            users = JSON.parse(data);
        }

        // Agregar nuevo usuario
        const newUser: User = {
            username: body.username,
            password: body.password,
            role: "user",
        };

        users.push(newUser);

        // Guardar en el JSON
        fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

        return new Response(JSON.stringify({ success: true, user: newUser }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error desconocido";

        return new Response(JSON.stringify({ success: false, error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
