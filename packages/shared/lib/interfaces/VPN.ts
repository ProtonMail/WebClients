import { PLANS } from '../constants';

export interface MyLocationResponse {
    IP: string;
    Lat: number;
    Long: number;
    Country: string;
    ISP: string;
}

export interface VPNCountry {
    count: number;
}

export interface VPNCountries {
    free_vpn: VPNCountry;
    [PLANS.VPNBASIC]: VPNCountry;
    [PLANS.VPNPLUS]: VPNCountry;
}
