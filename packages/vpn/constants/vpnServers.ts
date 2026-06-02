import type { VPNServersCountData } from '../src/types/Server';
import { countries, servers } from './staticCounters';

const FREE_SERVER_COUNT = 2000;
const FREE_COUNTRY_COUNT = 10;

export const VPN_SERVERS: VPNServersCountData = {
    free: { countries: FREE_COUNTRY_COUNT, servers: FREE_SERVER_COUNT },
    paid: { countries, servers },
} as const;
