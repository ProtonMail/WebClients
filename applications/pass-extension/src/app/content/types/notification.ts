import type { FormEntryPrompt, Item, SelectedItem } from '@proton/pass/types';

import type { IFrameAppService } from './iframe';

export enum NotificationAction {
    AUTOSAVE = 'AUTOSAVE',
    OTP = 'OTP',
}

export type NotificationActions =
    | { action: NotificationAction.AUTOSAVE; submission: FormEntryPrompt }
    | { action: NotificationAction.OTP; item: SelectedItem; hostname: string };

export type AutosaveRequest = { item: Item<'login'>; submission: FormEntryPrompt };

export interface InjectedNotification extends IFrameAppService<NotificationActions> {}
