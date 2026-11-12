import type { SelectedItem } from '../../types/data/items';
import { ItemFlag } from '../../types/data/items';
import type { ItemUpdateFlagsRequest } from '../../types/api/pass';
import type { MaybeNull } from '../../types/utils';

export enum MonitorCheckType {
    WEAK = 'weak',
    REUSED = 'reused',
    COMPROMISED = 'compromised',
    MISSING_2FA = '2fa',
}

type MonitorCheckSkipFlagKey = keyof Pick<
    ItemUpdateFlagsRequest,
    'SkipWeakPasswordCheck' | 'SkipCompromisedPasswordCheck' | 'SkipReusedPasswordCheck' | 'Skip2FACheck'
>;

export type MonitorCheckConfig = {
    flag: ItemFlag;
    apiKey: MonitorCheckSkipFlagKey;
};

export const MONITOR_CHECK_CONFIG: Record<MonitorCheckType, MonitorCheckConfig> = {
    [MonitorCheckType.WEAK]: { flag: ItemFlag.SkipWeakPasswordCheck, apiKey: 'SkipWeakPasswordCheck' },
    [MonitorCheckType.REUSED]: { flag: ItemFlag.SkipReusedPasswordCheck, apiKey: 'SkipReusedPasswordCheck' },
    [MonitorCheckType.COMPROMISED]: {
        flag: ItemFlag.SkipCompromisedPasswordCheck,
        apiKey: 'SkipCompromisedPasswordCheck',
    },
    [MonitorCheckType.MISSING_2FA]: { flag: ItemFlag.Skip2FACheck, apiKey: 'Skip2FACheck' },
};

export type ProtonAddressID = string;
export type CustomAddressID = string;

export enum AddressType {
    PROTON = 'proton',
    ALIAS = 'alias',
    CUSTOM = 'custom',
}

export enum BreachFlag {
    MonitorDisabled = 1 << 0,
}

export type AddressBreachDTO<T extends AddressType = AddressType> = {
    [AddressType.ALIAS]: { type: AddressType.ALIAS } & SelectedItem;
    [AddressType.CUSTOM]: { type: AddressType.CUSTOM; addressId: CustomAddressID };
    [AddressType.PROTON]: { type: AddressType.PROTON; addressId: CustomAddressID };
}[T];

export type MonitorVerifyDTO = { addressId: CustomAddressID; code: string };
export type MonitorToggleDTO<T extends AddressType = AddressType> = AddressBreachDTO<T> & { monitor: boolean };

export type MonitorDomain = { domain: string; breachedAt: number };

type MonitorAddressBase = {
    breachedAt?: MaybeNull<number>;
    breachCount?: number;
    breached: boolean;
    email: string;
    monitored: boolean;
};

export type MonitorAddress<T extends AddressType = AddressType> = MonitorAddressBase &
    {
        [AddressType.ALIAS]: { type: AddressType.ALIAS } & SelectedItem;
        [AddressType.CUSTOM]: {
            type: AddressType.CUSTOM;
            addressId: CustomAddressID;
            verified: boolean;
            suggestion: boolean;
        };
        [AddressType.PROTON]: { type: AddressType.PROTON; addressId: CustomAddressID };
    }[T];

export type CompromisedPasswordEntry = {
    compromised: boolean;
    etag: string;
    lastChangeAtCheck?: number;
    revision: number;
};
