import type { FormEntryPrompt, Item, SelectedItem } from '@proton/pass/types';

import type { IFrameAppService } from './iframe';

export enum NotificationAction {
    AUTOSAVE_PROMPT = 'AUTOSAVE_PROMPT',
    AUTOFILL_OTP_PROMPT = 'AUTOFILL_OTP_PROMPT',
}

export type NotificationActions =
    | { action: NotificationAction.AUTOSAVE_PROMPT; submission: FormEntryPrompt }
    | { action: NotificationAction.AUTOFILL_OTP_PROMPT; item: SelectedItem };

export type NotificationAutosaveRequestPayload = { item: Item<'login'>; submission: FormEntryPrompt };

export interface InjectedNotification extends IFrameAppService<NotificationActions> {}
