import { c, msgid } from 'ttag';

import useApiResult from '@proton/components/hooks/useApiResult';

import type { Gateway } from './Gateway';
import type { GatewayUser } from './GatewayUser';
import { queryVPNGateways } from './api';

interface TableConfig {
    Name: boolean;
    Status: boolean;
    Country: boolean;
    IPv4: boolean;
    IPv6: boolean;
    Load: boolean;
    Deleted?: boolean;
}

interface GatewayConfig {
    Table: TableConfig;
    ServerTable: TableConfig;
    Provisioning: {
        TranslatedDuration: string;
    };
}

export const useGateways = () => {
    const {
        loading,
        result,
        request: refresh,
    } = useApiResult<
        {
            Config: GatewayConfig;
            Countries: readonly string[];
            Gateways: readonly Gateway[];
            Users: readonly GatewayUser[];
        },
        typeof queryVPNGateways
    >(queryVPNGateways, []);

    const nbDay = 7;

    return {
        loading: !result || loading,
        config: result?.Config || {
            Table: {
                Name: false,
                Status: true,
                Country: true,
                IPv4: true,
                IPv6: false,
                Load: false,
            },
            ServerTable: {
                Name: false,
                Status: true,
                Country: true,
                IPv4: true,
                IPv6: false,
                Load: true,
            },
            Provisioning: {
                TranslatedDuration: c('Label').ngettext(msgid`${nbDay} day`, `${nbDay} days`, nbDay),
            },
        },
        countries: result?.Countries,
        gateways: result?.Gateways,
        users: result?.Users || [],
        refresh,
    };
};

export default useGateways;
