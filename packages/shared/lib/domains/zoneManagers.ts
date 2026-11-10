import { c } from 'ttag';

import { ZONE_APEX } from './constants';
import type { DnsRecord } from './dnsRecords';

export enum ZoneManager {
    WIX = 'wix',
    PORKBUN = 'porkbun',
    AMAZON_ROUTE_53 = 'amazon-route-53',
    HOSTPOINT = 'hostpoint',
    OVH = 'ovh',
}

export interface ZoneManagerOverrides {
    formatHostname?: (hostname: string, domainName: string) => string;
    formatValue?: (record: DnsRecord) => string;
}

const blankApexHostnameOverrides: ZoneManagerOverrides = {
    formatHostname: (hostname) =>
        hostname === ZONE_APEX ? c('Label for domain setup').t`Leave field blank` : hostname,
};

const zoneManagerOverrides: Record<ZoneManager, ZoneManagerOverrides> = {
    [ZoneManager.WIX]: blankApexHostnameOverrides,
    [ZoneManager.PORKBUN]: blankApexHostnameOverrides,
    [ZoneManager.AMAZON_ROUTE_53]: blankApexHostnameOverrides,
    [ZoneManager.HOSTPOINT]: blankApexHostnameOverrides,
    [ZoneManager.OVH]: blankApexHostnameOverrides,
};

export const getZoneManagerOverrides = (zoneManager?: ZoneManager): ZoneManagerOverrides => {
    if (zoneManager === undefined) {
        return {};
    }
    return zoneManagerOverrides[zoneManager];
};
