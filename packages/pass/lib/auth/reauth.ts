import type { ExportOptions } from '@proton/pass/lib/export/types';
import type { Maybe } from '@proton/pass/types';

export enum ReauthAction {
    SSO_BIOMETRICS = 'SSO_BIOMETRICS',
    SSO_EXPORT = 'SSO_EXPORT',
    SSO_OFFLINE = 'SSO_OFFLINE',
    SSO_PW_LOCK = 'SSO_PW_LOCK',
}

type ReauthLockChange = {
    /** Optional previous secret in order to
     * properly disable the active lock */
    current: Maybe<string>;
    ttl: number;
};

export type ReauthActionPayload =
    | { type: ReauthAction.SSO_BIOMETRICS; data: ReauthLockChange }
    | { type: ReauthAction.SSO_EXPORT; data: ExportOptions }
    | { type: ReauthAction.SSO_OFFLINE }
    | { type: ReauthAction.SSO_PW_LOCK; data: ReauthLockChange };
