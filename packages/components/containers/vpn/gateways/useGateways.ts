import { useEffect, useRef, useState } from 'react';

import { c, msgid } from 'ttag';

import useApi from '@proton/components/hooks/useApi';
import { SECOND } from '@proton/shared/lib/constants';

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

export const useGateways = (maxAge: number) => {
    const [result, setResult] = useState<GatewayResult | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const api = useApi();

    const refreshStateRef = useRef({ lastUpdate: 0, lastSuccess: 0 });

    const refresh = async () => {
        try {
            refreshStateRef.current.lastUpdate = Date.now();
            const result = await api<GatewayResult>(queryVPNGateways());
            refreshStateRef.current.lastSuccess = Date.now();
            setResult(result);
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();

        const refreshHandle = setInterval(() => {
            const { lastSuccess, lastUpdate } = refreshStateRef.current;

            // Don't start to refresh until first success
            if (!lastSuccess) {
                return;
            }

            const now = Date.now();
            if (now > lastUpdate + maxAge / 5 && now > lastSuccess + maxAge) {
                refresh();
            }
        }, 30 * SECOND);

        return () => {
            clearInterval(refreshHandle);
        };
    }, []);

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
        locations: result?.Locations,
        gateways: result?.Gateways,
        users: result?.Users || [],
        refresh,
    };
};

export default useGateways;
