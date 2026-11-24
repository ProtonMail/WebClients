import type { VpnLocationFilterPolicy } from './useSharedServers';

export enum PolicyType {
    /**
     * An ACTIVE NONE policy means that no users of the org can access any location.
     */
    None = 0,

    /**
     * An ACTIVE ALL policy means that all users of the org can access every location.
     */
    All = 1,

    /**
     * If only CUSTOM policies are ACTIVE, the locations rights are cumulative.
     */
    Custom = 2,
}

export enum PolicyState {
    Inactive = 0,
    Active = 1,
}

export type LocalStatus = 'created' | 'edited' | 'deleted' | 'unchanged';

export type Location = {
    Country: string;
    localizedCountryName: string;
};

export interface VpnLocationFilterPolicyLocal extends VpnLocationFilterPolicy {
    localStatus?: LocalStatus;
}
