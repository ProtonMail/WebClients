import type { Item, PromptedFormEntry } from '@proton/pass/types';

import type { IFrameAppService } from './iframe';

export enum NotificationAction {
    AUTOSAVE_PROMPT,
}

export type NotificationSetActionPayload = {
    action: NotificationAction.AUTOSAVE_PROMPT;
    submission: PromptedFormEntry;
};

export type NotificationAutosaveRequestPayload = { item: Item<'login'>; submission: PromptedFormEntry };

export type OpenNotificationOptions = {
    action: NotificationAction;
    submission: PromptedFormEntry;
};

export interface InjectedNotification extends IFrameAppService<OpenNotificationOptions> {}
