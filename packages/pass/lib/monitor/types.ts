import type { MaybeNull, SelectedItem } from '@proton/pass/types';

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

export type MonitorAddressBase = {
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
