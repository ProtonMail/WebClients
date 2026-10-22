import { c, msgid } from 'ttag';

import { useAllSubscriptions } from '@proton/account/allSubscriptions/hooks';
import { useEntitlementChecksForOrgAndUser } from '@proton/account/entitlementCatalog/hooks';
import { useApi } from '@proton/app-context/useApi';
import { useFetchData } from '@proton/components/hooks/useFetchData';
import { ADDON_PREFIXES } from '@proton/payments/core/constants';
import { getSubscriptionSupportingAddon } from '@proton/payments/core/plan/addons';
import { getPlanName } from '@proton/payments/core/subscription/helpers';
import type { Organization } from '@proton/shared/lib/interfaces/Organization';

import { queryVPNGateways } from '../apis/gateway';
import type { Gateway, GatewayGroup, GatewayLocation, GatewayUser } from '../types/Gateway';

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
    Users: GatewayUser[];
    Groups: GatewayGroup[];
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

export const useGateways = (organization: Organization | undefined, maxAge: number) => {
    const api = useApi();

    const [allSubscriptions = []] = useAllSubscriptions();
    const [entitlements] = useEntitlementChecksForOrgAndUser();
    const subscriptionWithIpAddon = getSubscriptionSupportingAddon(allSubscriptions, ADDON_PREFIXES.IP);
    const planWithIpAddon = getPlanName(subscriptionWithIpAddon);
    const hasGatewaysAccess = !!organization && (entitlements.hasMaxDedicatedIps || planWithIpAddon !== undefined);

    // If there’s no result yet, define fallback config
    const nbDay = 7;

    // Specialized fetcher for Gateways
    const fetcher = async () => {
        if (!hasGatewaysAccess || organization.MaxDedicatedIPs < 1) {
            return {
                Config: getDefaultConfig(nbDay),
                Countries: [],
                Locations: [],
                Gateways: [],
                Users: [],
                Groups: [],
            };
        }

        return api<GatewayResult>(queryVPNGateways());
    };

    // Reuse the generic fetch-data hook
    const { loading, result, refresh } = useFetchData<GatewayResult>({
        fetcher,
        maxAge,
    });

    return {
        hasGatewaysAccess,
        planWithIpAddon,
        loading,
        config: result?.Config || getDefaultConfig(nbDay),
        locations: result?.Locations,
        gateways: result?.Gateways,
        users: result?.Users || [],
        groups: result?.Groups || [],
        refresh,
    };
};
