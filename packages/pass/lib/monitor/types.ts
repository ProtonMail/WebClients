import type { MaybeNull, SelectedItem } from '@proton/pass/types';

export type ProtonAddressID = string;
export type CustomAddressID = string;

export enum AddressType {
    PROTON = 'proton',
    ALIAS = 'alias',
    CUSTOM = 'custom',
}

export type AddressVerify = { addressId: CustomAddressID; code: string };

export type AddressBreachDTO<T extends AddressType = AddressType> = {
    [AddressType.ALIAS]: { type: AddressType.ALIAS } & SelectedItem;
    [AddressType.CUSTOM]: { type: AddressType.CUSTOM; addressId: CustomAddressID };
    [AddressType.PROTON]: { type: AddressType.PROTON; addressId: CustomAddressID };
}[T];

export type MonitorDomain = { domain: string; breachedAt: number };

export type MonitorAddressBase = {
    breachedAt?: MaybeNull<number>;
    breachCount?: number;
    breached: boolean;
    email: string;
    monitored: boolean;
    verified: boolean;
};

export type MonitorAddress<T extends AddressType = AddressType> = MonitorAddressBase &
    {
        [AddressType.ALIAS]: { type: AddressType.ALIAS } & SelectedItem;
        [AddressType.CUSTOM]: { type: AddressType.CUSTOM; addressId: CustomAddressID };
        [AddressType.PROTON]: { type: AddressType.PROTON; addressId: CustomAddressID };
    }[T];
