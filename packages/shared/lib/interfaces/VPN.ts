export interface MyLocationResponse {
    IP: string;
    Lat: number;
    Long: number;
    Country: string;
    ISP: string;
}

export interface VPNCountries {
    free: string[];
    basic: string[];
    all: string[];
}
