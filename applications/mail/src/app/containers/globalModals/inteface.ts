import type { SPAM_ACTION } from '@proton/shared/lib/mail/mailSettings';

export enum ModalType {
    Schedule = 'schedule',
    Snooze = 'snooze',
    Unsubscribe = 'unsubscribe',
}

export interface ScheduleModalPayload {
    type: ModalType.Schedule;
    value: {
        isMessage: boolean;
        onConfirm: () => void;
    };
}

export interface SnoozeModalPayload {
    type: ModalType.Snooze;
    value: {
        onConfirm: () => void;
    };
}

export interface UnsubscribeModalPayload {
    type: ModalType.Unsubscribe;
    value: {
        isMessage: boolean;
        elementLength: number;
        onConfirm: (spamAction: SPAM_ACTION) => void;
    };
}

export type ModalPayload = ScheduleModalPayload | SnoozeModalPayload | UnsubscribeModalPayload;
export type ModalListener = (payload: ModalPayload) => void;

export interface GlobalModal {
    subscribe: (cb: ModalListener) => void;
    notify: (payload: ModalPayload) => void;
}
