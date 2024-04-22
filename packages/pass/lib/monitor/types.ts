export type ProtonAddressID = string;
export type CustomAddressID = string;

export type MonitorSummary = {
    enabled: boolean;
    breaches: number;
    duplicatePasswords: number;
    weakPasswords: number;
    missing2FAs: number;
};

export enum AddressType {
    PROTON = 'PROTON',
    ALIAS = 'ALIAS',
    CUSTOM = 'CUSTOM',
}
