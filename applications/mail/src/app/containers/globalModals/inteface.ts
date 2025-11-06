import type { Sync } from '@proton/activation/src/logic/sync/sync.interface';
import type { SPAM_ACTION } from '@proton/shared/lib/mail/mailSettings';

export enum ModalType {
    Schedule = 'schedule',
    Snooze = 'snooze',
    Unsubscribe = 'unsubscribe',
    CategoriesViewB2BOnboarding = 'categoriesViewB2BOnboarding',
    BYOESpotlight = 'BYOESpotlight',
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

export interface CategoriesViewB2BOnboardingModalPayload {
    type: ModalType.CategoriesViewB2BOnboarding;
    value: {
        flagValue: number;
    };
}

export interface BYOESpotlightModalPayload {
    type: ModalType.BYOESpotlight;
    value: {
        forwardingSyncs: Sync[];
        onDisplayed: () => void;
    };
}

export type ModalPayload =
    | ScheduleModalPayload
    | SnoozeModalPayload
    | UnsubscribeModalPayload
    | CategoriesViewB2BOnboardingModalPayload
    | BYOESpotlightModalPayload;
export type ModalListener = (payload: ModalPayload) => void;

export interface GlobalModal {
    subscribe: (cb: ModalListener) => void;
    notify: (payload: ModalPayload) => void;
}
