import type { ExportRequestOptions } from '@proton/pass/lib/export/types';
import type { Maybe } from '@proton/pass/types';

export enum ReauthAction {
    BIOMETRICS_SETUP = 'BIOMETRICS_SETUP',
    EXPORT_CONFIRM = 'EXPORT_CONFIRM',
    OFFLINE_SETUP = 'OFFLINE_SETUP',
    PW_LOCK_SETUP = 'PW_LOCK_SETUP',
}

type ReauthLockChange = {
    /** Optional previous secret in order to
     * properly disable the active lock */
    current: Maybe<string>;
    ttl: number;
};

export type ReauthActionPayload =
    | { type: ReauthAction.BIOMETRICS_SETUP; data: ReauthLockChange }
    | { type: ReauthAction.EXPORT_CONFIRM; data: ExportRequestOptions }
    | { type: ReauthAction.OFFLINE_SETUP }
    | { type: ReauthAction.PW_LOCK_SETUP; data: ReauthLockChange };

/** Checks if the reauth action requires backup password authentication */
export const isSSOBackupPasswordReauth = ({ type }: ReauthActionPayload) =>
    type === ReauthAction.BIOMETRICS_SETUP ||
    type === ReauthAction.OFFLINE_SETUP ||
    type === ReauthAction.PW_LOCK_SETUP;
