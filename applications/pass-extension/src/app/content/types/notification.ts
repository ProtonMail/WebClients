import type { SelectedPasskey } from '@proton/pass/lib/passkeys/types';
import type { AutosaveFormEntry, AutosavePayload, Item, SelectedItem } from '@proton/pass/types';

import type { IFrameAppService } from './iframe';

export enum NotificationAction {
    AUTOSAVE = 'AUTOSAVE',
    OTP = 'OTP',
    PASSKEY_CREATE = 'PASSKEY::CREATE',
    PASSKEY_GET = 'PASSKEY::GET',
}

export type NotificationActions =
    | { action: NotificationAction.AUTOSAVE; data: AutosavePayload }
    | { action: NotificationAction.OTP; item: SelectedItem }
    | { action: NotificationAction.PASSKEY_GET; request: string; token: string; passkeys: SelectedPasskey[] }
    | { action: NotificationAction.PASSKEY_CREATE; request: string; token: string };

export type AutosaveRequest = { item: Item<'login'>; submission: AutosaveFormEntry };

export interface InjectedNotification extends IFrameAppService<NotificationActions> {}
