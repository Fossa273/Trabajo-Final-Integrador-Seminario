import prisma from "../lib/prisma.js";

class EmailTemplateModel {

    async getAll() {
        return await prisma.emailTemplate.findMany({ orderBy: { key: "asc" } });
    }

    async getByKey(key) {
        return await prisma.emailTemplate.findUnique({
            where: { key }
        });
    }

    async upsert(key, { subject, body }) {
        return await prisma.emailTemplate.upsert({
            where: { key },
            update: { subject, body },
            create: { key, subject, body }
        });
    }
}

export default new EmailTemplateModel();
