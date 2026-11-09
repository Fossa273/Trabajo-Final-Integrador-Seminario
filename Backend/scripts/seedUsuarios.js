import prisma from "../src/lib/prisma.js";
import bcrypt from "bcryptjs";

const ADMINS = [
    {
        username: "admin",
        password: "admin123",
        rol: "administrador"
    },
    {
        username: "demo.admin",
        password: "demo123",
        rol: "administrador"
    }
];

const SALT_ROUNDS = 10;

async function seed() {
    for (const admin of ADMINS) {
        const existing = await prisma.usuario.findUnique({
            where: { username: admin.username }
        });

        if (existing) {
            console.log(`El administrador "${admin.username}" ya existe. Se omite.`);
            continue;
        }

        const hashed = await bcrypt.hash(admin.password, SALT_ROUNDS);

        await prisma.usuario.create({
            data: {
                username: admin.username,
                password: hashed,
                rol: admin.rol,
                idCli: null,
                passwordTemporal: false
            }
        });

        console.log(`Administrador "${admin.username}" creado correctamente.`);
    }

    console.log("Seed de usuarios finalizado.");
    await prisma.$disconnect();
    process.exit(0);
}

seed().catch(async (err) => {
    console.error("Error al sembrar usuarios:", err.message);
    await prisma.$disconnect();
    process.exit(1);
});
