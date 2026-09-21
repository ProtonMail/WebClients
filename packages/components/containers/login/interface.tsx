import type { ParsedUnprivatizationData } from '@proton/account/members/unprivatization';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import type { AuthResponse, AuthVersion, InfoResponse } from '@proton/shared/lib/authentication/interface';
import type { ResumedSessionResult } from '@proton/shared/lib/authentication/persistedSessionHelper';
import type { TwoFactorAuthTypes } from '@proton/shared/lib/authentication/twoFactor';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import type {
    Address,
    Api,
    KeyMigrationKTVerifier,
    KeyTransparencyActivation,
    PreAuthKTVerifier,
    KeySalt as tsKeySalt,
    User as tsUser,
} from '@proton/shared/lib/interfaces';
import type { AddressGenerationSetup, ClaimableAddress } from '@proton/shared/lib/keys';
import type { AuthDeviceOutput, DeviceData, DeviceSecretData, DeviceSecretUser } from '@proton/shared/lib/keys/device';
import type { OrganizationData, UnprivatizationContextData } from '@proton/shared/lib/keys/unprivatization/helper';

import type { ChallengeResult } from '../challenge/interface';

export interface AddressGeneration {
    externalEmailAddress: Address | undefined;
    availableDomains: string[];
    setup: AddressGenerationSetup;
    claimableAddress: ClaimableAddress | undefined;
}

export enum AuthStep {
    LOGIN = 0,
    TWO_FA = 1,
    LOST_TWO_FA = 2,
    UNLOCK = 3,
    NEW_PASSWORD = 4,
    SSO = 5,
    DONE = 6,
}

export interface AuthTypes {
    twoFactor: TwoFactorAuthTypes;
    unlock: boolean;
}

export enum SSOLoginCapabilites {
    SETUP_BACKUP_PASSWORD = 0,
    SETUP_WITHOUT_BACKUP_PASSWORD = 1,
    FIRST_LOGIN_AFTER_CONVERSION = 2,
    ASK_ADMIN = 3,
    ENTER_BACKUP_PASSWORD = 4,
    NEW_BACKUP_PASSWORD = 5,
    NEW_BACKUP_PASSWORD_DISABLED = 6,
    OTHER_DEVICES = 7,
}

export interface SSOSetupData {
    type: 'setup';
    deviceData: DeviceData;
    unprivatizationContextData: UnprivatizationContextData;
    parsedUnprivatizationData: ParsedUnprivatizationData;
    organizationData: UnprivatizationContextData['organizationData'];
    authDevices: AuthDeviceOutput[];
    intent: {
        capabilities: Set<SSOLoginCapabilites>;
        step: SSOLoginCapabilites;
    };
}

export interface SSOSetPasswordData {
    type: 'set-password';
    keyPassword: string;
    authDevices: AuthDeviceOutput[];
    deviceSecretData: DeviceSecretData;
    organizationData: UnprivatizationContextData['organizationData'];
    intent: {
        capabilities: Set<SSOLoginCapabilites>;
        step: SSOLoginCapabilites;
    };
}

export type SSOPollingSuccessCb = (deviceSecretUser: DeviceSecretUser) => void;
export type SSOPollingErrorCb = (error: any) => void;
export type SSOPolling = {
    start: () => () => void;
    addListener: (success: SSOPollingSuccessCb, error: SSOPollingErrorCb) => () => void;
};

export interface SSOUnlockData {
    type: 'unlock';
    deviceData: DeviceData;
    authDevices: AuthDeviceOutput[];
    address: Address;
    organizationData: UnprivatizationContextData['organizationData'];
    poll: SSOPolling;
    intent: {
        capabilities: Set<SSOLoginCapabilites>;
        step: SSOLoginCapabilites;
    };
}

export interface SSOInactiveData {
    type: 'inactive';
    deviceData: DeviceData;
    authDevices: AuthDeviceOutput[];
    address: Address;
    organizationData: UnprivatizationContextData['organizationData'];
    poll: SSOPolling;
    intent: {
        capabilities: Set<SSOLoginCapabilites>;
        step: SSOLoginCapabilites;
    };
}

export type SSODataTypes = SSOSetupData | SSOUnlockData | SSOInactiveData | SSOSetPasswordData;

export interface AuthCacheResult {
    ktActivation: KeyTransparencyActivation;
    appName: APP_NAMES;
    toApp: APP_NAMES | undefined;
    productParam: ProductParam;
    shouldSetup?: boolean;
    authType: AuthType;
    authVersion: AuthVersion;
    authResponse: AuthResponse;
    api: Api;
    data: {
        user?: tsUser;
        salts?: tsKeySalt[];
        addresses?: Address[];
        ssoData?: SSODataTypes;
        passwordPolicies?: OrganizationData['passwordPolicies'];
    };
    authTypes: AuthTypes;
    username: string;
    persistent: boolean;
    loginPassword: string;
    ignoreUnlock: boolean;
    addressGeneration?: AddressGeneration;
    setupVPN: boolean;
    preAuthKTVerifier: PreAuthKTVerifier;
    keyMigrationKTVerifier: KeyMigrationKTVerifier;
    challengeResult: ChallengeResult;
}

export type AuthFlows = 'signup' | 'reset' | 'switch' | 'login' | 'auto-resume' | undefined;

export type AuthInterruption = 'fork-redirect-consent' | 'oauth-consent' | 'reauth';

export interface AppIntent {
    app: APP_NAMES;
    ref?: 'product-switch';
}

export interface AuthSession {
    loginPassword?: string;
    path?: string;
    flow?: AuthFlows;
    /** Interruptions this session has already been through, in the order they happened */
    interruptions?: AuthInterruption[];
    appIntent?: AppIntent;
    data: ResumedSessionResult;
}

export type AuthActionResponse =
    | {
          to: AuthStep.DONE;
          session: AuthSession;
      }
    | {
          cache: AuthCacheResult;
          to: Exclude<AuthStep, AuthStep.DONE>;
      };

export enum AuthType {
    Auto = 0,
    // AutoSrp references step 2 of the auto login with srp authentication.
    // This is an intermediate phase, when we rollout auto login style
    // everywhere, it can be replaced with the `Srp` type
    AutoSrp = 1,
    Srp = 2,
    ExternalSSO = 3,
}

export enum ExternalSSOFlow {
    Sp = 0,
    Idp = 1,
    Redirect = 2,
}

export type AuthTypeData =
    | { type: AuthType.Auto }
    | { type: AuthType.AutoSrp; info: InfoResponse; username: string }
    | { type: AuthType.Srp }
    | { type: AuthType.ExternalSSO };
