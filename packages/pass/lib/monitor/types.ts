export type ProtonAddressID = string;
export type CustomAddressID = string;

export enum AddressType {
    PROTON = 'PROTON',
    ALIAS = 'ALIAS',
    CUSTOM = 'CUSTOM',
}

export type AddressVerify = { emailId: CustomAddressID; code: string };
