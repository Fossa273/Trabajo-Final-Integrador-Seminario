const STATUS_LABEL = {
    pendiente: "Pendiente",
    "seña": "Seña abonada",
    pagado: "Pagado"
};

const PAID_STATUSES = ["seña", "pagado"];

export class Payment {
    constructor(data = {}) {
        Object.assign(this, data);
    }

    static from(json) {
        return new Payment(json);
    }

    get contractId() {
        return this.idContract ?? this.contract?.idContract ?? null;
    }

    get clientName() {
        const client = this.contract?.reservation?.client;
        if (!client) return "";
        return `${client.nameCli || ""} ${client.surnameCli || ""}`.trim();
    }

    get statusLabel() {
        return STATUS_LABEL[this.statusPayment] || this.statusPayment || "";
    }

    get isPending() {
        return this.statusPayment === "pendiente";
    }

    get isPaid() {
        return PAID_STATUSES.includes(this.statusPayment);
    }

    get dueDateLabel() {
        if (!this.dueDate) return "Sin vencimiento";
        const date = new Date(this.dueDate);
        if (Number.isNaN(date.getTime())) return "Sin vencimiento";
        return date.toLocaleDateString("es-AR");
    }
}

export default Payment;
