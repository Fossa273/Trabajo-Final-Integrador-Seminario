import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { existsSync } from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(ROOT, ".env") });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error("Falta DATABASE_URL en Backend/.env");
    process.exit(1);
}

const url = new URL(DATABASE_URL);
const host = url.hostname;
const port = Number(url.port || 3306);
const user = decodeURIComponent(url.username);
const password = url.password ? decodeURIComponent(url.password) : "";
const database = url.pathname.replace(/^\//, "") || "event_hall";

const SEEDS = [
    "seedLocations.js",
    "seedLounges.js",
    "seedCardDetails.js",
    "seedExtraServices.js",
    "seedUsuarios.js",
    "seedPrices.js",
    "seedSettings.js",
    "seedEmailTemplates.js"
];

const run = (cmd, args) => {
    const result = spawnSync(cmd, args, { stdio: "inherit" });
    if (result.status !== 0) {
        console.error(`Paso fallido: ${cmd} ${args.join(" ")}`);
        process.exit(1);
    }
};

async function ensureDatabase() {
    const connection = await mysql.createConnection({
        host,
        port,
        user,
        password
    });

    await connection.query(
        `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log(`Base de datos "${database}" lista.`);

    await connection.end();
}

async function setup() {
    console.log("=== SETUP AUTOMÁTICO ===");

    console.log("\n[1/2] Creando la base de datos si no existe...");
    await ensureDatabase();

    console.log("\nAplicando el esquema (prisma db push)...");
    run(process.execPath, [path.join(ROOT, "node_modules/prisma/build/index.js"), "db", "push", "--skip-generate"]);

    console.log("\n[2/2] Cargando datos de ejemplo (seeds)...");
    for (const seed of SEEDS) {
        const seedPath = path.join(__dirname, seed);
        if (!existsSync(seedPath)) {
            console.error(`No existe la seed: ${seed}`);
            process.exit(1);
        }
        console.log(`\n> ${seed}`);
        run(process.execPath, [seedPath]);
    }

    console.log("\n=== SETUP COMPLETADO ===");
    console.log("Opciones para acceder al sistema en http://localhost:3000 (usuario admin).");
}

setup().catch(async (err) => {
    console.error("Error durante el setup:", err.message);
    console.error(
        "Verificá que el backend pueda conectarse a MySQL. Ajustá DATABASE_URL en Backend/.env"
    );
    process.exit(1);
});