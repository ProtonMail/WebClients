import type { DelegatedAccessStateEnum, DelegatedAccessTypeEnum } from '@proton/shared/lib/interfaces/DelegatedAccess';

import type { PASSWORD_MODE } from '../constants';
import type { Address, KeyWithRecoverySecret, PasswordPolicies } from '../interfaces';

type RequestUsernamePayload =
    | {
          Email: string;
      }
    | {
          Phone: string;
      };
export const requestUsername = (data: RequestUsernamePayload) => ({
    url: 'core/v4/reset/username',
    method: 'post',
    data,
});
export const validateResetToken = (username: string, token: string) => ({
    url: `core/v4/reset/${username}/${token}`,
    method: 'get',
});

export interface AutoResetTokenPayload {
    Username: string;
    Method: 'email' | 'phone';
}

export interface ResetTokenPayload {
    Username: string;
    Email?: string;
    Phone?: string;
}

export const requestLoginResetToken = <T = ResetTokenPayload>(data: T) => ({
    url: 'core/v4/reset',
    method: 'post',
    data,
});

// Login is valid for external accounts
export type RecoveryMethod = 'email' | 'sms' | 'login' | 'mnemonic';
export type AccountType = 'internal' | 'external';

export interface DelegatedAccessSummary {
    DelegatedAccessID: string;
    State: DelegatedAccessStateEnum;
    Types: DelegatedAccessTypeEnum;
    TargetEmail: string;
    CreateTime: number;
}

export interface ExistingSession {
    CreateTime: number;
    LocalizedClientName: string;
}

export interface ValidateResetTokenResponse {
    UserID: string;
    UserKeys: KeyWithRecoverySecret[];
    Addresses: Address[];
    ToMigrate: 0 | 1;
    SupportPgpV6Keys: 0 | 1;
    PasswordPolicies: PasswordPolicies;
    PasswordMode: PASSWORD_MODE;
    DelegatedAccesses: DelegatedAccessSummary[];
    Sessions: ExistingSession[];
}
