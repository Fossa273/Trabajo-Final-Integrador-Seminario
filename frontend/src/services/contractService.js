import { api } from "./api";
import { Contract } from "../models";

const hydrateList = (data) =>
    Array.isArray(data) ? data.map(Contract.from) : [];

const hydrateEnvelope = (data) => {
    if (data && data.contract) {
        return { ...data, contract: Contract.from(data.contract) };
    }
    return data;
};

const call = async (promise) => hydrateEnvelope(await promise);

export const contractService = {
    getAll: async () => hydrateList(await api.get("/api/contract")),
    getMine: async () => hydrateList(await api.get("/api/contract/mis-contratos")),
    getById: async (id) => Contract.from(await api.get(`/api/contract/${id}`)),
    revision: (id, data) => call(api.put(`/api/contract/${id}/revision`, data)),
    update: (id, data) => call(api.put(`/api/contract/${id}`, data)),
    updateEdit: (id, data) => call(api.put(`/api/contract/${id}/edit`, data)),
    remove: (id, data) => call(api.del(`/api/contract/${id}`, data)),
    enviar: (id) => call(api.post(`/api/contract/${id}/enviar`)),
    aceptar: (id) => call(api.post(`/api/contract/${id}/aceptar`)),
    solicitarModificacion: (id, data) =>
        call(api.put(`/api/contract/${id}/modificacion`, data)),
    revisarModificacion: (id, data) =>
        call(api.put(`/api/contract/${id}/modificacion/revision`, data)),
    resolverModificacion: (id, data) =>
        call(api.post(`/api/contract/${id}/modificacion/rechazo`, data)),
    solicitarCambioFecha: (id, data) =>
        call(api.put(`/api/contract/${id}/cambio-fecha`, data)),
    aceptarCambioFecha: (id) =>
        call(api.post(`/api/contract/${id}/cambio-fecha/aceptar`)),
    cancelarCambioFecha: (id, data) =>
        api.post(`/api/contract/${id}/cambio-fecha/cancelar`, data),
    eliminarCliente: (id) => api.del(`/api/contract/${id}/cliente`)
};
