import prisma from "../lib/prisma.js";

class SettingModel {

    async getAll() {
        return await prisma.setting.findMany({ orderBy: { key: "asc" } });
    }

    async getByKey(key) {
        return await prisma.setting.findUnique({
            where: { key }
        });
    }

    async upsert(key, value) {
        const normalized = String(value);

        return await prisma.setting.upsert({
            where: { key },
            update: { value: normalized },
            create: { key, value: normalized }
        });
    }
}

export default new SettingModel();
