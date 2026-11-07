import settingModel from "../models/setting.model.js";
import httpError from "../utils/httpError.js";

export const SETTING_KEYS = {
    DEPOSIT_PERCENTAGE: "payment_deposit_percentage",
    REMINDER_DAYS_BEFORE_EVENT: "payment_reminder_days_before_event",
    REMINDERS_ENABLED: "payment_reminders_enabled"
};

const DEFAULT_PAYMENT_SETTINGS = {
    depositPercentage: 30,
    reminderDaysBeforeEvent: 7,
    remindersEnabled: true
};

function toNumber(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

class SettingService {

    async getPaymentSettings() {
        const rows = await settingModel.getAll();
        const map = new Map(rows.map((row) => [row.key, row.value]));

        return {
            depositPercentage: toNumber(
                map.get(SETTING_KEYS.DEPOSIT_PERCENTAGE),
                DEFAULT_PAYMENT_SETTINGS.depositPercentage
            ),
            reminderDaysBeforeEvent: toNumber(
                map.get(SETTING_KEYS.REMINDER_DAYS_BEFORE_EVENT),
                DEFAULT_PAYMENT_SETTINGS.reminderDaysBeforeEvent
            ),
            remindersEnabled:
                String(
                    map.get(SETTING_KEYS.REMINDERS_ENABLED) ??
                        DEFAULT_PAYMENT_SETTINGS.remindersEnabled
                ).toLowerCase() !== "false"
        };
    }

    async getDepositPercentage() {
        const settings = await this.getPaymentSettings();
        return settings.depositPercentage;
    }

    async updatePaymentSettings(data = {}) {
        const current = await this.getPaymentSettings();

        const depositPercentage =
            data.depositPercentage === undefined
                ? current.depositPercentage
                : Number(data.depositPercentage);
        const reminderDaysBeforeEvent =
            data.reminderDaysBeforeEvent === undefined
                ? current.reminderDaysBeforeEvent
                : Number(data.reminderDaysBeforeEvent);
        const remindersEnabled =
            data.remindersEnabled === undefined
                ? current.remindersEnabled
                : Boolean(data.remindersEnabled);

        if (
            !Number.isFinite(depositPercentage) ||
            depositPercentage < 0 ||
            depositPercentage > 100
        ) {
            throw httpError(
                400,
                "El porcentaje de seña debe ser un número entre 0 y 100."
            );
        }

        if (
            !Number.isInteger(reminderDaysBeforeEvent) ||
            reminderDaysBeforeEvent < 0 ||
            reminderDaysBeforeEvent > 365
        ) {
            throw httpError(
                400,
                "Los días de anticipación del recordatorio deben ser un entero entre 0 y 365."
            );
        }

        await settingModel.upsert(
            SETTING_KEYS.DEPOSIT_PERCENTAGE,
            depositPercentage
        );
        await settingModel.upsert(
            SETTING_KEYS.REMINDER_DAYS_BEFORE_EVENT,
            reminderDaysBeforeEvent
        );
        await settingModel.upsert(
            SETTING_KEYS.REMINDERS_ENABLED,
            remindersEnabled ? "true" : "false"
        );

        return await this.getPaymentSettings();
    }
}

export default new SettingService();
