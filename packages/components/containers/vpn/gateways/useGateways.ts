import { c, msgid } from 'ttag';

import useApi from '@proton/components/hooks/useApi';
import { useFetchData } from '@proton/components/hooks/useFetchData';

import type { Gateway } from './Gateway';
import type { GatewayLocation } from './GatewayLocation';
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

interface GatewayResult {
    Config: GatewayConfig;
    Countries: readonly string[];
    Locations: readonly GatewayLocation[];
    Gateways: readonly Gateway[];
    Users: readonly GatewayUser[];
}

const getDefaultConfig = (nbDay: number) => {
    return {
        Table: {
            Name: false,
            Status: true,
            Country: true,
            IPv4: true,
            IPv6: false,
            Load: false,
            Deleted: false,
        },
        ServerTable: {
            Name: false,
            Status: true,
            Country: true,
            IPv4: true,
            IPv6: false,
            Load: true,
            Deleted: false,
        },
        Provisioning: {
            // This string is only generated if getDefaultConfig() is actually called
            TranslatedDuration: c('Label').ngettext(msgid`${nbDay} day`, `${nbDay} days`, nbDay),
        },
    };
};

export const useGateways = (maxAge: number) => {
    const api = useApi();

    // Specialized fetcher for Gateways
    const fetcher = async () => {
        return api<GatewayResult>(queryVPNGateways());
    };

    // Reuse the generic fetch-data hook
    const { loading, result, refresh } = useFetchData<GatewayResult>({
        fetcher,
        maxAge,
    });

    // If there’s no result yet, define fallback config
    const nbDay = 7;

    return {
        loading,
        config: result?.Config || getDefaultConfig(nbDay),
        locations: result?.Locations,
        gateways: result?.Gateways,
        users: result?.Users || [],
        refresh,
    };
};

export default useGateways;
