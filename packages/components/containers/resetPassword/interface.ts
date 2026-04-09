import type { AccountType, RecoveryMethod, ValidateResetTokenResponse } from '@proton/shared/lib/api/reset';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import type { AuthResponse } from '@proton/shared/lib/authentication/interface';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import type { Api, DecryptedKey, KeyTransparencyActivation } from '@proton/shared/lib/interfaces';

import type { AuthSession } from '../login/interface';

export enum STEPS {
    LOADING,
    REQUEST_RECOVERY_METHODS = 1,
    NO_RECOVERY_METHODS,
    FORGOT_RECOVERY_METHOD,
    REQUEST_RESET_TOKEN,
    VALIDATE_RESET_TOKEN,
    NEW_PASSWORD,
    ERROR,
    DONE,
}

export interface MnemonicData {
    api: Api;
    decryptedUserKeys: DecryptedKey[];
    authResponse: AuthResponse;
}

export interface ResetCacheResult {
    appName: APP_NAMES;
    username: string;
    persistent: boolean;
    productParam: ProductParam;
    Methods: RecoveryMethod[];
    type: AccountType;
    method?: RecoveryMethod;
    value?: string;
    token?: string;
    resetResponse?: ValidateResetTokenResponse;
    mnemonicData?: MnemonicData;
    ktActivation: KeyTransparencyActivation;
    setupVPN: boolean;
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
