import {
    queryVPNCountriesCount,
    queryVPNLogicalServerInfoCount,
    queryVPNServersCount,
} from '@proton/shared/lib/api/vpn';
import { addApiMock } from '@proton/testing';

export const defaultServersCount = {
    Code: 1000,
    Servers: 437,
    Countries: 51,
    Capacity: 511.28999999999996,
};

export const defaultCountriesCount = {
    Code: 1000,
    Counts: [
        {
            MaxTier: 0,
            Count: 5,
        },
        {
            MaxTier: 1,
            Count: 31,
        },
        {
            MaxTier: 2,
            MaxAI: 0,
            Count: 51,
        },
    ],
};

export const defaultLogicalVpnCount = {
    Code: 1000,
    Counts: [13, 173, 248],
};

export function mockUserVPNServersCountApi() {
    addApiMock(queryVPNServersCount().url, () => defaultServersCount);
    addApiMock(queryVPNCountriesCount().url, () => defaultCountriesCount);
    addApiMock(queryVPNLogicalServerInfoCount().url, () => defaultLogicalVpnCount);
}
