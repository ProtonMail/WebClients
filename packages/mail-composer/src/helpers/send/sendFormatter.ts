import { differenceInSeconds } from 'date-fns';

import { sendMessageForm } from '@proton/shared/lib/api/messages';
import type { Packages } from '@proton/shared/lib/interfaces/mail/crypto';

const serializeJsonToFormData = (payload: any, context: string, data: any) => {
    if (!data || typeof data === 'boolean' || typeof data === 'number' || typeof data === 'string') {
        payload[context] = data;
    } else if (data instanceof Uint8Array) {
        payload[context] = new Blob([data as Uint8Array<ArrayBuffer>]);
    } else {
        Object.entries(data).forEach(([key, value]) => {
            serializeJsonToFormData(payload, `${context}[${key}]`, value);
        });
    }
};

interface Args {
    ID: string;
    packages: Packages;
    expiresIn?: Date;
    delaySendSeconds?: number;
    autoSaveContacts?: number;
    scheduledAt?: number;
    sendingFrom?: string;
}

export const sendFormatter = ({
    ID,
    packages,
    expiresIn,
    delaySendSeconds,
    autoSaveContacts,
    scheduledAt,
    sendingFrom,
}: Args) => {
    const payload: any = {};

    serializeJsonToFormData(payload, `Packages`, packages);

    if (expiresIn) {
        payload.ExpiresIn = differenceInSeconds(expiresIn, new Date());
    }
    if (delaySendSeconds) {
        payload.DelaySeconds = delaySendSeconds;
    }
    if (autoSaveContacts !== undefined) {
        payload.AutoSaveContacts = autoSaveContacts;
    }
    if (scheduledAt) {
        payload.DeliveryTime = scheduledAt;
    }

    return sendMessageForm(ID, payload, sendingFrom);
};
