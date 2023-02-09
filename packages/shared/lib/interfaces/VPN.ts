export interface MyLocationResponse {
    IP: string;
    Lat: number;
    Long: number;
    Country: string;
    ISP: string;
}

export interface VPNServersCount {
    Capacity: number;
    Countries: number;
    Servers: number;
}

export interface VPNServersCountData {
    free: {
        countries: number;
        servers: number;
    };
    paid: {
        countries: number;
        servers: number;
    };
}

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
