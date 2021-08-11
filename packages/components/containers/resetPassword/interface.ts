import { Address, Api, DecryptedKey } from '@proton/shared/lib/interfaces';
import { AuthResponse } from '@proton/shared/lib/authentication/interface';
import { AuthSession } from '../login/interface';

export enum STEPS {
    REQUEST_RECOVERY_METHODS = 1,
    NO_RECOVERY_METHODS,
    REQUEST_RESET_TOKEN,
    VALIDATE_RESET_TOKEN,
    DANGER_VERIFICATION,
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
    authApi: Api;
    decryptedUserKeys: DecryptedKey[];
    authResponse: AuthResponse;
}

export interface ResetCacheResult {
    username: string;
    Methods: RecoveryMethod[];
    method?: RecoveryMethod;
    value?: string;
    token?: string;
    resetResponse?: ValidateResetTokenResponse;
    mnemonicData?: MnemonicData;
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
          to:
              | STEPS.REQUEST_RESET_TOKEN
              | STEPS.REQUEST_RECOVERY_METHODS
              | STEPS.VALIDATE_RESET_TOKEN
              | STEPS.DANGER_VERIFICATION
              | STEPS.NEW_PASSWORD
              | STEPS.ERROR;
      };
