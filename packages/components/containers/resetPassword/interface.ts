import { AuthResponse } from '@proton/shared/lib/authentication/interface';
import { APP_NAMES } from '@proton/shared/lib/constants';
import { Address, Api, DecryptedKey, KeyTransparencyActivation, ResetSelfAudit } from '@proton/shared/lib/interfaces';

import { AuthSession } from '../login/interface';

export enum STEPS {
    LOADING,
    REQUEST_RECOVERY_METHODS = 1,
    NO_RECOVERY_METHODS,
    REQUEST_RESET_TOKEN,
    VALIDATE_RESET_TOKEN,
    NEW_PASSWORD,
    ERROR,
    DONE,
}

// Login is valid for external accounts
export type RecoveryMethod = 'email' | 'sms' | 'login' | 'mnemonic';
export type AccountType = 'internal' | 'external';

export interface ValidateResetTokenResponse {
    Addresses: Address[];
    ToMigrate: 0 | 1;
}

interface MnemonicData {
    api: Api;
    decryptedUserKeys: DecryptedKey[];
    authResponse: AuthResponse;
}

export interface ResetCacheResult {
    appName: APP_NAMES;
    username: string;
    persistent: boolean;
    Methods: RecoveryMethod[];
    type: AccountType;
    method?: RecoveryMethod;
    value?: string;
    token?: string;
    resetResponse?: ValidateResetTokenResponse;
    mnemonicData?: MnemonicData;
    hasTrustedDeviceRecovery: boolean;
    ktActivation: KeyTransparencyActivation;
    setupVPN: boolean;
    resetSelfAudit: ResetSelfAudit;
}

export type ResetActionResponse =
    | {
          to: STEPS.DONE;
          session: AuthSession;
      }
    | {
          to: STEPS.NO_RECOVERY_METHODS;
          error?: string;
      }
    | {
          cache: ResetCacheResult;
          to: Exclude<STEPS, STEPS.DONE | STEPS.NO_RECOVERY_METHODS>;
      };
