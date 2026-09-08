export type { MyLocationResponse } from '@proton/shared/lib/vpn/location';

export interface VPNServersCount {
    Capacity: number;
    Countries: number;
    Servers: number;
}

export type { VPNServersCountData } from '@proton/shared/lib/vpn/vpnServers';

export interface VPNServersCounts {
    free: VPNServersCount;
    paid: VPNServersCount;
}

export interface VPNLogicalsCount {
    Counts: { 2: number; 0: number };
}

export interface VPNCountryCount {
    MaxTier: 0 | 1 | 2;
    Count: number;
}

export interface VPNCountriesCount {
    Counts: VPNCountryCount[];
}
