import { Address } from '@proton/shared/lib/interfaces';
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
export type RecoveryMethod = 'email' | 'sms' | 'login';
export type AccountType = 'internal' | 'external';

export interface ValidateResetTokenResponse {
    Addresses: Address[];
    ToMigrate: 0 | 1;
}

export interface ResetCacheResult {
    username: string;
    Methods: RecoveryMethod[];
    method?: RecoveryMethod;
    value?: string;
    token?: string;
    resetResponse?: ValidateResetTokenResponse;
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
