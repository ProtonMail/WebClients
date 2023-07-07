import type { FormEntryPrompt, Item } from '@proton/pass/types';

import type { IFrameAppService } from './iframe';

export enum NotificationAction {
    AUTOSAVE_PROMPT,
}

export type NotificationSetActionPayload = {
    action: NotificationAction.AUTOSAVE_PROMPT;
    submission: FormEntryPrompt;
};

export type NotificationAutosaveRequestPayload = { item: Item<'login'>; submission: FormEntryPrompt };

export type OpenNotificationOptions = {
    action: NotificationAction;
    submission: FormEntryPrompt;
};

export interface InjectedNotification extends IFrameAppService<OpenNotificationOptions> {}
