import type { ParsedUnprivatizationData } from '@proton/account/members/unprivatization';
import type { Address } from '@proton/shared/lib/interfaces';
import type { AuthDeviceOutput, DeviceData, DeviceSecretData } from '@proton/shared/lib/keys/device';
import type { UnprivatizationContextData } from '@proton/shared/lib/keys/unprivatization/helper';

export enum AuthType {
    Auto = 0,
    // AutoSrp references step 2 of the auto login with srp authentication.
    // This is an intermediate phase, when we rollout auto login style
    // everywhere, it can be replaced with the `Srp` type
    AutoSrp = 1,
    Srp = 2,
    ExternalSSO = 3,
}

/** Which credentials form the sign-in shows; the auto mode's password step shows the username it checked. */
export type AuthTypeData =
    | { type: AuthType.Auto }
    | { type: AuthType.AutoSrp; username: string }
    | { type: AuthType.Srp }
    | { type: AuthType.ExternalSSO };

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

/** What every SSO sign-in has, whichever keys the device still needs. */
interface SSODataBase {
    organizationData: UnprivatizationContextData['organizationData'];
    /** The member's other signed-in devices, which can approve this one. */
    authDevices: AuthDeviceOutput[];
    /** What the member can do next, and which screen to start on. */
    intent: {
        capabilities: Set<SSOLoginCapabilites>;
        step: SSOLoginCapabilites;
    };
}

export interface SSOSetupData extends SSODataBase {
    type: 'setup';
    deviceData: DeviceData;
    unprivatizationContextData: UnprivatizationContextData;
    parsedUnprivatizationData: ParsedUnprivatizationData;
}

export interface SSOSetPasswordData extends SSODataBase {
    type: 'set-password';
    keyPassword: string;
    deviceSecretData: DeviceSecretData;
}

export interface SSOUnlockData extends SSODataBase {
    type: 'unlock';
    deviceData: DeviceData;
    address: Address;
    addresses: Address[];
}

export interface SSOInactiveData extends SSODataBase {
    type: 'inactive';
    deviceData: DeviceData;
    address: Address;
    addresses: Address[];
}

export type SSODataTypes = SSOSetupData | SSOUnlockData | SSOInactiveData | SSOSetPasswordData;
