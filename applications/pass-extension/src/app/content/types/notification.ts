import type { FormEntryPrompt, Item, SelectedItem } from '@proton/pass/types';

import type { IFrameAppService } from './iframe';

export enum NotificationAction {
    AUTOSAVE = 'AUTOSAVE',
    OTP = 'OTP',
    PASSKEY_CREATE = 'PASSKEY::CREATE',
    PASSKEY_GET = 'PASSKEY::GET',
}

export type NotificationActions =
    | { action: NotificationAction.AUTOSAVE; submission: FormEntryPrompt }
    | { action: NotificationAction.OTP; item: SelectedItem; hostname: string }
    | { action: NotificationAction.PASSKEY_GET; domain: string; request: string; token: string }
    | { action: NotificationAction.PASSKEY_CREATE; domain: string; request: string; token: string };

export type AutosaveRequest = { item: Item<'login'>; submission: FormEntryPrompt };

export interface InjectedNotification extends IFrameAppService<NotificationActions> {}
