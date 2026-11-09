import { api } from "./api";

export const paymentService = {
    getAll: () => api.get("/api/payment"),
    getById: (id) => api.get(`/api/payment/${id}`),
    getByContract: (idContract) => api.get(`/api/payment/contract/${idContract}`),
    create: (data) => api.post("/api/payment", data),
    generateInstallments: (data) => api.post("/api/payment/installments", data),
    update: (id, data) => api.put(`/api/payment/${id}`, data),
    remove: (id) => api.del(`/api/payment/${id}`),
    sendReminder: (id) => api.post(`/api/payment/${id}/reminder`),
    report: (id, formData) => api.upload(`/api/payment/${id}/report`, formData),
    confirmReport: (id, data = {}) =>
        api.post(`/api/payment/${id}/report/confirm`, data),
    rejectReport: (id, data) =>
        api.post(`/api/payment/${id}/report/reject`, data),
    getPendingCount: () => api.get("/api/payment/pending/count"),
    getReportedCount: () => api.get("/api/payment/reported/count"),
    getEmailTemplates: () => api.get("/api/payment/email-templates"),
    updateEmailTemplates: (data) => api.put("/api/payment/email-templates", data),
    resetEmailTemplates: () => api.post("/api/payment/email-templates/reset"),
    getSettings: () => api.get("/api/payment/settings"),
    updateSettings: (data) => api.put("/api/payment/settings", data)
};
