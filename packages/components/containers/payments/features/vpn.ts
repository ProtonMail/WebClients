import { c, msgid } from 'ttag';

import {
    BRAND_NAME,
    CALENDAR_SHORT_APP_NAME,
    DRIVE_SHORT_APP_NAME,
    FREE_VPN_CONNECTIONS,
    MAIL_SHORT_APP_NAME,
    PLANS,
    VPN_APP_NAME,
    VPN_CONNECTIONS,
} from '@proton/shared/lib/constants';
import type { VPNServersCountData } from '@proton/shared/lib/interfaces';
import { Audience } from '@proton/shared/lib/interfaces';
import { getFreeServers, getPlusServers } from '@proton/shared/lib/vpn/features';

import type { PlanCardFeature, PlanCardFeatureDefinition } from './interface';

export const getB2BFreeVPNConnectionsText = (n: number) => {
    return c('Subscription attribute').ngettext(
        msgid`${n} free VPN connection per user`,
        `${n} free VPN connections per user`,
        n
    );
};

export const getAdvancedVPNFeature = (): PlanCardFeatureDefinition => ({
    icon: 'checkmark-circle',
    included: true,
    text: c('new_plans: Upsell attribute').t`Access advanced VPN features`,
});

export const getB2BHighSpeedVPNConnectionsText = (n: number) => {
    return c('Subscription attribute').ngettext(
        msgid`${n} high-speed VPN connection per user`,
        `${n} high-speed VPN connections per user`,
        n
    );
};

export const getB2BHighSpeedVPNConnectionsFeature = (): PlanCardFeatureDefinition => ({
    icon: 'brand-proton-vpn',
    text: getB2BHighSpeedVPNConnectionsText(VPN_CONNECTIONS),
    included: true,
});

export const getB2BVPNConnectionsText = (n: number) => {
    return c('Subscription attribute').ngettext(
        msgid`${n} VPN connection per user`,
        `${n} VPN connections per user`,
        n
    );
};

export const getHighSpeedVPNConnectionsText = (n: number) => {
    return c('Subscription attribute').ngettext(
        msgid`${n} high-speed VPN connection`,
        `${n} high-speed VPN connections`,
        n
    );
};

export const getHighSpeedVPNConnectionsFeature = (n: number = VPN_CONNECTIONS): PlanCardFeatureDefinition => ({
    icon: 'brand-proton-vpn',
    text: getHighSpeedVPNConnectionsText(n),
    included: true,
});

export const getVPNConnectionsText = (n: number) => {
    return c('Subscription attribute').ngettext(msgid`${n} VPN connection`, `${n} VPN connections`, n);
};

export const getVPNConnectionsFeature = (n: number = VPN_CONNECTIONS): PlanCardFeatureDefinition => ({
    icon: 'brand-proton-vpn',
    text: getVPNConnectionsText(n),
    included: true,
});

export const getB2BHighSpeedVPNConnections = (): PlanCardFeatureDefinition => {
    return {
        text: getB2BHighSpeedVPNConnectionsText(VPN_CONNECTIONS),
        included: true,
        icon: 'brand-proton-vpn',
    };
};

export const getVPNAppFeature = ({
    serversCount,
    family,
    duo,
}: {
    serversCount: VPNServersCountData;
    family?: boolean;
    duo?: boolean;
}): PlanCardFeatureDefinition => {
    const serversAndCountries = getPlusServers(serversCount.paid.servers, serversCount.paid.countries);
    let tooltip = c('new_plans: tooltip')
        .t`${VPN_APP_NAME}: Access blocked content and browse privately. Includes ${serversAndCountries}, highest VPN speeds, access to worldwide streaming services, malware and ad-blocker, fast BitTorrent downloads, and more.`;

    if (duo || family) {
        tooltip = c('new_plans: tooltip')
            .t`Protect your family from harmful websites and access our high-speed VPN servers to stream your favorite content`;
    }

    return {
        text: VPN_APP_NAME,
        tooltip,
        included: true,
        icon: 'brand-proton-vpn',
    };
};

export const getCountries = (text: string, highlight?: boolean): PlanCardFeatureDefinition => {
    return {
        text,
        included: true,
        highlight,
        icon: 'earth',
    };
};

export const getVPNSpeed = (type: 'medium' | 'highest', highlight?: boolean): PlanCardFeatureDefinition => {
    return {
        text: type === 'medium' ? c('new_plans').t`Medium VPN speed` : c('new_plans').t`Highest VPN speed`,
        included: true,
        highlight,
        icon: 'chevrons-right',
    };
};

export const getStreaming = (included: boolean, highlight?: boolean): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`High-speed streaming`,
        tooltip: c('new_plans: tooltip')
            .t`Access content on streaming services, including Netflix, Disney+, and Prime Video, from anywhere`,
        included,
        highlight,
        icon: 'play',
    };
};

export const getP2P = (included: boolean, highlight?: boolean): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Fast P2P/BitTorrent downloads`,
        tooltip: c('new_plans: tooltip').t`Support for file-sharing protocols like BitTorrent`,
        included,
        highlight,
        icon: 'arrows-switch',
    };
};

export const getAdvancedVPNCustomizations = (included: boolean, highlight?: boolean): PlanCardFeatureDefinition => {
    return {
        text: c('vpn_2step: feature').t`Advanced VPN customizations`,
        tooltip: c('vpn_2step: tooltip')
            .t`Access to Secure core servers, fast P2P/BitTorrent downloads, Tor over VPN, and more.`,
        included,
        highlight,
        icon: 'arrows-switch',
    };
};

export const getDoubleHop = (included: boolean, highlight?: boolean): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Double hop`,
        tooltip: c('new_plans: tooltip')
            .t`Defends against the threat to VPN privacy by passing your internet traffic through multiple servers.`,
        included,
        highlight,
        icon: 'arrows-switch',
    };
};

export const getNetShield = (included: boolean, highlight?: boolean): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Ad-blocker and malware protection`,
        tooltip: c('new_plans: tooltip')
            .t`Specially designed NetShield protects your device and speeds up your browsing by blocking ads, trackers, and malware`,
        included,
        highlight,
        icon: 'shield',
    };
};
export const getSecureCore = (included: boolean, highlight?: boolean): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Secure Core servers`,
        tooltip: c('new_plans: tooltip')
            .t`Defends against the threat to VPN privacy by passing your internet traffic through multiple servers`,
        included,
        highlight,
        icon: 'servers',
    };
};
export const getTor = (included: boolean, highlight?: boolean): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Tor over VPN`,
        tooltip: c('new_plans: tooltip').t`Route your internet traffic through the Tor network with a single click`,
        included,
        highlight,
        icon: 'brand-tor',
    };
};

const getVPNConnectionsB2B = (n = 0, highlight?: boolean): PlanCardFeatureDefinition => {
    return {
        text: n === 1 ? getB2BFreeVPNConnectionsText(1) : getB2BHighSpeedVPNConnectionsText(n),
        tooltip: c('new_plans: tooltip')
            .t`One VPN connection allows one device to connect to ${VPN_APP_NAME} at any given time. For instance, to connect a phone and a laptop to ${VPN_APP_NAME} at the same time, you need two VPN connections.`,
        included: true,
        highlight,
        icon: 'brand-proton-vpn',
    };
};

export const getVPNConnections = (n = 0, highlight?: boolean): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').ngettext(msgid`${n} VPN connection`, `${n} VPN connections`, n),
        included: true,
        highlight,
        icon: 'brand-proton-vpn',
    };
};
export const getProtectDevices = (n = 0, highlight?: boolean): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').ngettext(
            msgid`Protect ${n} device at a time`,
            `Protect ${n} devices at a time`,
            n
        ),
        included: true,
        highlight,
        icon: 'brand-proton-vpn',
    };
};
export const getNoLogs = (highlight?: boolean): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Strict no-logs policy`,
        tooltip: c('new_plans: tooltip')
            .t`We keep no session usage logs of what you do online, and we do not log metadata that can compromise your privacy`,
        included: true,
        highlight,
        icon: 'alias',
    };
};
export const getBandwidth = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Unlimited volume/bandwidth`,
        included: true,
    };
};

export const getNoAds = (): PlanCardFeatureDefinition => {
    return {
        text: c('vpn_2step: feature').t`No ads`,
        included: true,
    };
};
const getDNSLeak = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`DNS leak prevention`,
        tooltip: c('new_plans: tooltip')
            .t`When connected to our VPN, your DNS queries through our encrypted VPN tunnel, adding to your online privacy and security`,
        included: true,
    };
};
export const getKillSwitch = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Kill switch/always-on VPN`,
        tooltip: c('new_plans: tooltip')
            .t`Keeps you protected by blocking all network connections when you are unexpectedly disconnected from our VPN server.`,
        included: true,
    };
};
const getEncryption = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Encrypted VPN servers`,
        tooltip: c('new_plans: tooltip')
            .t`Our servers’ hard disks are fully encrypted with multiple password layers so your data is protected even if our hardware is compromised`,
        included: true,
    };
};
const getRouterSupport = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Router support`,
        tooltip: c('new_plans: tooltip')
            .t`Protect every device connected to your WiFi network. It’s also useful if you have devices that do not support VPN settings directly.`,
        included: true,
    };
};
export const getPrioritySupport = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Priority support & live chat`,
        tooltip: '',
        included: true,
        icon: 'life-ring',
    };
};
export const getFreeFeatures = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature')
            .t`Free features from ${BRAND_NAME} ${MAIL_SHORT_APP_NAME}, ${CALENDAR_SHORT_APP_NAME}, and ${DRIVE_SHORT_APP_NAME}`,
        tooltip: '',
        included: true,
    };
};
export const getAllPlatforms = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Available on all platforms`,
        tooltip: '',
        included: true,
    };
};
export const getRefundable = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Fully refundable for 30 days`,
        tooltip: '',
        included: true,
    };
};
const getSplitTunnel = (included: boolean): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Split tunneling (Android and Windows)`,
        tooltip: c('new_plans: tooltip')
            .t`Allows you to access more than one network at the same time, e.g., stream a film from another country while still getting local search results`,
        included: included,
    };
};
export const getVPNDevices = (n: number): PlanCardFeatureDefinition => {
    if (n === 1) {
        return {
            text: c('new_plans: feature').t`Free VPN on a single device`,
            tooltip: c('new_plans: tooltip')
                .t`Allows you to access more than one network at the same time, e.g., stream a film from another country while still getting local search results`,
            included: true,
        };
    }
    return {
        text: c('new_plans: feature').ngettext(
            msgid`High-speed VPN on ${n} device`,
            `High-speed VPN on ${n} devices`,
            n
        ),
        included: true,
    };
};

export const getDedicatedServersVPNFeature = (serversCount?: VPNServersCountData): PlanCardFeatureDefinition => {
    let text: string;

    if (serversCount === undefined) {
        text = c('new_plans: Upsell attribute').t`Dedicated server locations in North America and Europe`;
    } else {
        const numberOfCountries = serversCount.paid.countries;
        text = c('new_plans: Upsell attribute').t`Dedicated server locations in ${numberOfCountries}+ countries`;
    }

    return {
        icon: 'checkmark',
        included: true,
        text,
        tooltip: c('new_plans: tooltip')
            .t`Dedicated servers with dedicated IP address(es) can be added to private gateways to enable fine-tuned access control`,
    };
};

export const getDedicatedAccountManagerVPNFeature = (): PlanCardFeatureDefinition => ({
    icon: 'checkmark',
    included: true,
    text: c('new_plans: Upsell attribute').t`Dedicated Account manager`,
});

export const getAESEncryptionVPNFeature = (): PlanCardFeatureDefinition => ({
    icon: 'checkmark',
    included: true,
    text: c('new_plans: Upsell attribute').t`AES 256-bit VPN encryption`,
});

export const getCensorshipCircumventionVPNFeature = (): PlanCardFeatureDefinition => ({
    icon: 'checkmark',
    included: true,
    text: c('new_plans: Upsell attribute').t`Censorship circumvention`,
});

export const getCentralControlPanelVPNFeature = (): PlanCardFeatureDefinition => ({
    icon: 'checkmark',
    included: true,
    text: c('new_plans: Upsell attribute').t`Central control panel`,
});

export const getAutoConnectVPNFeature = (): PlanCardFeatureDefinition => ({
    icon: 'checkmark',
    included: true,
    text: c('new_plans: Upsell attribute').t`Auto-connect`,
});

export const getMultiPlatformSupportVPNFeature = (): PlanCardFeatureDefinition => ({
    icon: 'checkmark',
    included: true,
    text: c('new_plans: Upsell attribute').t`Multi-platform support`,
});

export const get24x7SupportVPNFeature = (): PlanCardFeatureDefinition => ({
    icon: 'checkmark',
    included: true,
    text: c('new_plans: Upsell attribute').t`24/7 support`,
});

export const getRequire2FAVPNFeature = (): PlanCardFeatureDefinition => ({
    icon: 'checkmark',
    included: true,
    text: c('new_plans: Upsell attribute').t`Require 2FA`,
});

export const getBrowserExtensionVPNFeature = (): PlanCardFeatureDefinition => ({
    icon: 'checkmark',
    included: true,
    text: c('new_plans: Upsell attribute').t`Browser extension`,
});

export const getPrivateGatewaysVPNFeature = (): PlanCardFeatureDefinition => ({
    icon: 'checkmark',
    included: true,
    text: c('new_plans: Upsell attribute').t`Private gateways`,
    tooltip: c('new_plans: tooltip')
        .t`Lock down your company resources from the public internet and make them accessible only via your private gateways`,
});

export const getVPNFeatures = (serversCount: VPNServersCountData): PlanCardFeature[] => {
    const freeServers = getFreeServers(serversCount.free.servers, serversCount.free.countries);
    const plusServers = getPlusServers(serversCount.paid.servers, serversCount.paid.countries);
    return [
        {
            name: 'vpn',
            target: Audience.B2C,
            plans: {
                [PLANS.FREE]: getVPNConnections(FREE_VPN_CONNECTIONS),
                [PLANS.BUNDLE]: getVPNConnections(VPN_CONNECTIONS),
                [PLANS.MAIL]: getVPNConnections(FREE_VPN_CONNECTIONS),
                [PLANS.VPN]: getVPNConnections(VPN_CONNECTIONS),
                [PLANS.DRIVE]: getVPNConnections(FREE_VPN_CONNECTIONS),
                [PLANS.DRIVE_BUSINESS]: getVPNConnections(FREE_VPN_CONNECTIONS),
                [PLANS.PASS]: getVPNConnections(FREE_VPN_CONNECTIONS),
                [PLANS.WALLET]: getVPNConnections(FREE_VPN_CONNECTIONS),
                [PLANS.FAMILY]: getVPNConnections(VPN_CONNECTIONS),
                [PLANS.DUO]: getVPNConnections(VPN_CONNECTIONS),
                [PLANS.MAIL_PRO]: getVPNConnections(FREE_VPN_CONNECTIONS),
                [PLANS.MAIL_BUSINESS]: getVPNConnections(FREE_VPN_CONNECTIONS),
                [PLANS.BUNDLE_PRO]: getVPNConnections(VPN_CONNECTIONS),
                [PLANS.BUNDLE_PRO_2024]: getVPNConnections(VPN_CONNECTIONS),
                [PLANS.PASS_PRO]: getVPNConnections(FREE_VPN_CONNECTIONS),
                [PLANS.PASS_BUSINESS]: getVPNConnections(FREE_VPN_CONNECTIONS),
                [PLANS.VPN_PRO]: getVPNConnections(VPN_CONNECTIONS),
                [PLANS.VPN_BUSINESS]: getVPNConnections(VPN_CONNECTIONS),
            },
        },
        {
            name: 'vpn-connections-per-user',
            target: Audience.B2B,
            plans: {
                [PLANS.FREE]: getVPNConnections(1),
                [PLANS.BUNDLE]: getVPNConnectionsB2B(VPN_CONNECTIONS),
                [PLANS.MAIL]: getVPNConnections(1),
                [PLANS.VPN]: getVPNConnectionsB2B(VPN_CONNECTIONS),
                [PLANS.DRIVE]: getVPNConnections(1),
                [PLANS.DRIVE_BUSINESS]: getVPNConnections(1),
                [PLANS.PASS]: getVPNConnections(1),
                [PLANS.WALLET]: getVPNConnections(1),
                [PLANS.FAMILY]: getVPNConnectionsB2B(1),
                [PLANS.DUO]: getVPNConnectionsB2B(1),
                [PLANS.MAIL_PRO]: getVPNConnectionsB2B(1),
                [PLANS.MAIL_BUSINESS]: getVPNConnectionsB2B(1),
                [PLANS.BUNDLE_PRO]: getVPNConnectionsB2B(VPN_CONNECTIONS),
                [PLANS.BUNDLE_PRO_2024]: getVPNConnectionsB2B(VPN_CONNECTIONS),
                [PLANS.PASS_PRO]: getVPNConnections(1),
                [PLANS.PASS_BUSINESS]: getVPNConnections(1),
                [PLANS.VPN_PRO]: getVPNConnectionsB2B(VPN_CONNECTIONS),
                [PLANS.VPN_BUSINESS]: getVPNConnectionsB2B(VPN_CONNECTIONS),
            },
        },
        {
            name: 'vpn-connections-per-user-family',
            target: Audience.FAMILY,
            plans: {
                [PLANS.FREE]: getVPNConnections(1),
                [PLANS.BUNDLE]: getVPNConnections(VPN_CONNECTIONS),
                [PLANS.MAIL]: getVPNConnections(1),
                [PLANS.VPN]: getVPNConnections(VPN_CONNECTIONS),
                [PLANS.DRIVE]: getVPNConnections(1),
                [PLANS.DRIVE_BUSINESS]: getVPNConnections(1),
                [PLANS.PASS]: getVPNConnections(1),
                [PLANS.WALLET]: getVPNConnections(1),
                [PLANS.FAMILY]: getVPNConnectionsB2B(VPN_CONNECTIONS),
                [PLANS.DUO]: getVPNConnectionsB2B(VPN_CONNECTIONS),
                [PLANS.MAIL_PRO]: getVPNConnectionsB2B(1),
                [PLANS.MAIL_BUSINESS]: getVPNConnectionsB2B(1),
                [PLANS.BUNDLE_PRO]: getVPNConnectionsB2B(VPN_CONNECTIONS),
                [PLANS.BUNDLE_PRO_2024]: getVPNConnectionsB2B(VPN_CONNECTIONS),
                [PLANS.PASS_PRO]: getVPNConnections(1),
                [PLANS.PASS_BUSINESS]: getVPNConnections(1),
                [PLANS.VPN_PRO]: getVPNConnectionsB2B(VPN_CONNECTIONS),
                [PLANS.VPN_BUSINESS]: getVPNConnectionsB2B(VPN_CONNECTIONS),
            },
        },
        {
            name: 'countries',
            plans: {
                [PLANS.FREE]: getCountries(freeServers),
                [PLANS.BUNDLE]: getCountries(plusServers),
                [PLANS.MAIL]: getCountries(freeServers),
                [PLANS.VPN]: getCountries(plusServers),
                [PLANS.DRIVE]: getCountries(freeServers),
                [PLANS.DRIVE_BUSINESS]: getCountries(freeServers),
                [PLANS.PASS]: getCountries(freeServers),
                [PLANS.WALLET]: getCountries(freeServers),
                [PLANS.FAMILY]: getCountries(plusServers),
                [PLANS.DUO]: getCountries(plusServers),
                [PLANS.MAIL_PRO]: getCountries(freeServers),
                [PLANS.MAIL_BUSINESS]: getCountries(freeServers),
                [PLANS.BUNDLE_PRO]: getCountries(plusServers),
                [PLANS.BUNDLE_PRO_2024]: getCountries(plusServers),
                [PLANS.PASS_PRO]: getCountries(freeServers),
                [PLANS.PASS_BUSINESS]: getCountries(freeServers),
                [PLANS.VPN_PRO]: getCountries(plusServers),
                [PLANS.VPN_BUSINESS]: getCountries(plusServers),
            },
        },
        {
            name: 'vpn-speed',
            plans: {
                [PLANS.FREE]: getVPNSpeed('medium'),
                [PLANS.BUNDLE]: getVPNSpeed('highest'),
                [PLANS.MAIL]: getVPNSpeed('medium'),
                [PLANS.VPN]: getVPNSpeed('highest'),
                [PLANS.DRIVE]: getVPNSpeed('medium'),
                [PLANS.DRIVE_BUSINESS]: getVPNSpeed('medium'),
                [PLANS.PASS]: getVPNSpeed('medium'),
                [PLANS.WALLET]: getVPNSpeed('medium'),
                [PLANS.FAMILY]: getVPNSpeed('highest'),
                [PLANS.DUO]: getVPNSpeed('highest'),
                [PLANS.MAIL_PRO]: getVPNSpeed('medium'),
                [PLANS.MAIL_BUSINESS]: getVPNSpeed('medium'),
                [PLANS.BUNDLE_PRO]: getVPNSpeed('highest'),
                [PLANS.BUNDLE_PRO_2024]: getVPNSpeed('highest'),
                [PLANS.PASS_PRO]: getVPNSpeed('medium'),
                [PLANS.PASS_BUSINESS]: getVPNSpeed('medium'),
                [PLANS.VPN_PRO]: getVPNSpeed('highest'),
                [PLANS.VPN_BUSINESS]: getVPNSpeed('highest'),
            },
        },
        {
            name: 'netshield',
            plans: {
                [PLANS.FREE]: getNetShield(false),
                [PLANS.BUNDLE]: getNetShield(true),
                [PLANS.MAIL]: getNetShield(false),
                [PLANS.VPN]: getNetShield(true),
                [PLANS.DRIVE]: getNetShield(false),
                [PLANS.DRIVE_BUSINESS]: getNetShield(false),
                [PLANS.PASS]: getNetShield(false),
                [PLANS.WALLET]: getNetShield(false),
                [PLANS.FAMILY]: getNetShield(true),
                [PLANS.DUO]: getNetShield(true),
                [PLANS.MAIL_PRO]: getNetShield(false),
                [PLANS.MAIL_BUSINESS]: getNetShield(false),
                [PLANS.PASS_PRO]: getNetShield(false),
                [PLANS.PASS_BUSINESS]: getNetShield(false),
                [PLANS.BUNDLE_PRO]: getNetShield(true),
                [PLANS.BUNDLE_PRO_2024]: getNetShield(true),
                [PLANS.VPN_PRO]: getNetShield(true),
                [PLANS.VPN_BUSINESS]: getNetShield(true),
            },
        },
        {
            name: 'streaming',
            plans: {
                [PLANS.FREE]: getStreaming(false),
                [PLANS.BUNDLE]: getStreaming(true),
                [PLANS.MAIL]: getStreaming(false),
                [PLANS.VPN]: getStreaming(true),
                [PLANS.DRIVE]: getStreaming(false),
                [PLANS.DRIVE_BUSINESS]: getStreaming(false),
                [PLANS.PASS]: getStreaming(false),
                [PLANS.WALLET]: getStreaming(false),
                [PLANS.FAMILY]: getStreaming(true),
                [PLANS.DUO]: getStreaming(true),
                [PLANS.MAIL_PRO]: getStreaming(false),
                [PLANS.MAIL_BUSINESS]: getStreaming(false),
                [PLANS.BUNDLE_PRO]: getStreaming(true),
                [PLANS.BUNDLE_PRO_2024]: getStreaming(true),
                [PLANS.PASS_PRO]: getStreaming(false),
                [PLANS.PASS_BUSINESS]: getStreaming(false),
                [PLANS.VPN_PRO]: getStreaming(true),
                [PLANS.VPN_BUSINESS]: getStreaming(true),
            },
        },
        {
            name: 'p2p',
            plans: {
                [PLANS.FREE]: getP2P(false),
                [PLANS.BUNDLE]: getP2P(true),
                [PLANS.MAIL]: getP2P(false),
                [PLANS.VPN]: getP2P(true),
                [PLANS.DRIVE]: getP2P(false),
                [PLANS.DRIVE_BUSINESS]: getP2P(false),
                [PLANS.PASS]: getP2P(false),
                [PLANS.WALLET]: getP2P(false),
                [PLANS.FAMILY]: getP2P(true),
                [PLANS.DUO]: getP2P(true),
                [PLANS.MAIL_PRO]: getP2P(false),
                [PLANS.MAIL_BUSINESS]: getP2P(false),
                [PLANS.BUNDLE_PRO]: getP2P(true),
                [PLANS.BUNDLE_PRO_2024]: getP2P(true),
                [PLANS.PASS_PRO]: getP2P(false),
                [PLANS.PASS_BUSINESS]: getP2P(false),
                [PLANS.VPN_PRO]: getP2P(true),
                [PLANS.VPN_BUSINESS]: getP2P(true),
            },
        },
        {
            name: 'hop',
            plans: {
                [PLANS.FREE]: getDoubleHop(false),
                [PLANS.BUNDLE]: getDoubleHop(true, true),
                [PLANS.MAIL]: getDoubleHop(false),
                [PLANS.VPN]: getDoubleHop(true, true),
                [PLANS.DRIVE]: getDoubleHop(false),
                [PLANS.DRIVE_BUSINESS]: getDoubleHop(false),
                [PLANS.PASS]: getDoubleHop(false),
                [PLANS.WALLET]: getDoubleHop(false),
                [PLANS.FAMILY]: getDoubleHop(true, true),
                [PLANS.DUO]: getDoubleHop(true, true),
                [PLANS.MAIL_PRO]: getDoubleHop(false),
                [PLANS.MAIL_BUSINESS]: getDoubleHop(false),
                [PLANS.BUNDLE_PRO]: getDoubleHop(true, true),
                [PLANS.BUNDLE_PRO_2024]: getDoubleHop(true, true),
                [PLANS.PASS_PRO]: getDoubleHop(false),
                [PLANS.PASS_BUSINESS]: getDoubleHop(false),
                [PLANS.VPN_PRO]: getDoubleHop(true, true),
                [PLANS.VPN_BUSINESS]: getDoubleHop(true, true),
            },
        },
        {
            name: 'secure',
            plans: {
                [PLANS.FREE]: getSecureCore(false),
                [PLANS.BUNDLE]: getSecureCore(true),
                [PLANS.MAIL]: getSecureCore(false),
                [PLANS.VPN]: getSecureCore(true),
                [PLANS.DRIVE]: getSecureCore(false),
                [PLANS.DRIVE_BUSINESS]: getSecureCore(false),
                [PLANS.PASS]: getSecureCore(false),
                [PLANS.WALLET]: getSecureCore(false),
                [PLANS.FAMILY]: getSecureCore(true),
                [PLANS.DUO]: getSecureCore(true),
                [PLANS.MAIL_PRO]: getSecureCore(false),
                [PLANS.MAIL_BUSINESS]: getSecureCore(false),
                [PLANS.BUNDLE_PRO]: getSecureCore(true),
                [PLANS.BUNDLE_PRO_2024]: getSecureCore(true),
                [PLANS.PASS_PRO]: getSecureCore(false),
                [PLANS.PASS_BUSINESS]: getSecureCore(false),
                [PLANS.VPN_PRO]: getSecureCore(true),
                [PLANS.VPN_BUSINESS]: getSecureCore(true),
            },
        },
        {
            name: 'tor',
            plans: {
                [PLANS.FREE]: getTor(false),
                [PLANS.BUNDLE]: getTor(true),
                [PLANS.MAIL]: getTor(false),
                [PLANS.VPN]: getTor(true),
                [PLANS.DRIVE]: getTor(false),
                [PLANS.DRIVE_BUSINESS]: getTor(false),
                [PLANS.PASS]: getTor(false),
                [PLANS.WALLET]: getTor(false),
                [PLANS.FAMILY]: getTor(true),
                [PLANS.DUO]: getTor(true),
                [PLANS.MAIL_PRO]: getTor(false),
                [PLANS.MAIL_BUSINESS]: getTor(false),
                [PLANS.BUNDLE_PRO]: getTor(true),
                [PLANS.BUNDLE_PRO_2024]: getTor(true),
                [PLANS.PASS_PRO]: getTor(false),
                [PLANS.PASS_BUSINESS]: getTor(false),
                [PLANS.VPN_PRO]: getTor(true),
                [PLANS.VPN_BUSINESS]: getTor(true),
            },
        },
        {
            name: 'logs',
            plans: {
                [PLANS.FREE]: getNoLogs(),
                [PLANS.BUNDLE]: getNoLogs(),
                [PLANS.MAIL]: getNoLogs(),
                [PLANS.VPN]: getNoLogs(),
                [PLANS.DRIVE]: getNoLogs(),
                [PLANS.DRIVE_BUSINESS]: getNoLogs(),
                [PLANS.PASS]: getNoLogs(),
                [PLANS.WALLET]: getNoLogs(),
                [PLANS.FAMILY]: getNoLogs(),
                [PLANS.DUO]: getNoLogs(),
                [PLANS.MAIL_PRO]: getNoLogs(),
                [PLANS.MAIL_BUSINESS]: getNoLogs(),
                [PLANS.BUNDLE_PRO]: getNoLogs(),
                [PLANS.BUNDLE_PRO_2024]: getNoLogs(),
                [PLANS.PASS_PRO]: getNoLogs(),
                [PLANS.PASS_BUSINESS]: getNoLogs(),
                [PLANS.VPN_PRO]: getNoLogs(),
                [PLANS.VPN_BUSINESS]: getNoLogs(),
            },
        },
        {
            name: 'bandwidth',
            plans: {
                [PLANS.FREE]: getBandwidth(),
                [PLANS.BUNDLE]: getBandwidth(),
                [PLANS.MAIL]: getBandwidth(),
                [PLANS.VPN]: getBandwidth(),
                [PLANS.DRIVE]: getBandwidth(),
                [PLANS.DRIVE_BUSINESS]: getBandwidth(),
                [PLANS.PASS]: getBandwidth(),
                [PLANS.WALLET]: getBandwidth(),
                [PLANS.FAMILY]: getBandwidth(),
                [PLANS.DUO]: getBandwidth(),
                [PLANS.MAIL_PRO]: getBandwidth(),
                [PLANS.MAIL_BUSINESS]: getBandwidth(),
                [PLANS.BUNDLE_PRO]: getBandwidth(),
                [PLANS.BUNDLE_PRO_2024]: getBandwidth(),
                [PLANS.PASS_PRO]: getBandwidth(),
                [PLANS.PASS_BUSINESS]: getBandwidth(),
                [PLANS.VPN_PRO]: getBandwidth(),
                [PLANS.VPN_BUSINESS]: getBandwidth(),
            },
        },
        {
            name: 'dns-leak',
            plans: {
                [PLANS.FREE]: getDNSLeak(),
                [PLANS.BUNDLE]: getDNSLeak(),
                [PLANS.MAIL]: getDNSLeak(),
                [PLANS.VPN]: getDNSLeak(),
                [PLANS.DRIVE]: getDNSLeak(),
                [PLANS.DRIVE_BUSINESS]: getDNSLeak(),
                [PLANS.PASS]: getDNSLeak(),
                [PLANS.WALLET]: getDNSLeak(),
                [PLANS.FAMILY]: getDNSLeak(),
                [PLANS.DUO]: getDNSLeak(),
                [PLANS.MAIL_PRO]: getDNSLeak(),
                [PLANS.MAIL_BUSINESS]: getDNSLeak(),
                [PLANS.BUNDLE_PRO]: getDNSLeak(),
                [PLANS.BUNDLE_PRO_2024]: getDNSLeak(),
                [PLANS.PASS_PRO]: getDNSLeak(),
                [PLANS.PASS_BUSINESS]: getDNSLeak(),
                [PLANS.VPN_PRO]: getDNSLeak(),
                [PLANS.VPN_BUSINESS]: getDNSLeak(),
            },
        },
        {
            name: 'kill-switch',
            plans: {
                [PLANS.FREE]: getKillSwitch(),
                [PLANS.BUNDLE]: getKillSwitch(),
                [PLANS.MAIL]: getKillSwitch(),
                [PLANS.VPN]: getKillSwitch(),
                [PLANS.DRIVE]: getKillSwitch(),
                [PLANS.DRIVE_BUSINESS]: getKillSwitch(),
                [PLANS.PASS]: getKillSwitch(),
                [PLANS.WALLET]: getKillSwitch(),
                [PLANS.FAMILY]: getKillSwitch(),
                [PLANS.DUO]: getKillSwitch(),
                [PLANS.MAIL_PRO]: getKillSwitch(),
                [PLANS.MAIL_BUSINESS]: getKillSwitch(),
                [PLANS.BUNDLE_PRO]: getKillSwitch(),
                [PLANS.BUNDLE_PRO_2024]: getKillSwitch(),
                [PLANS.PASS_PRO]: getKillSwitch(),
                [PLANS.PASS_BUSINESS]: getKillSwitch(),
                [PLANS.VPN_PRO]: getKillSwitch(),
                [PLANS.VPN_BUSINESS]: getKillSwitch(),
            },
        },
        {
            name: 'encryption',
            plans: {
                [PLANS.FREE]: getEncryption(),
                [PLANS.BUNDLE]: getEncryption(),
                [PLANS.MAIL]: getEncryption(),
                [PLANS.VPN]: getEncryption(),
                [PLANS.DRIVE]: getEncryption(),
                [PLANS.DRIVE_BUSINESS]: getEncryption(),
                [PLANS.PASS]: getEncryption(),
                [PLANS.WALLET]: getEncryption(),
                [PLANS.FAMILY]: getEncryption(),
                [PLANS.DUO]: getEncryption(),
                [PLANS.MAIL_PRO]: getEncryption(),
                [PLANS.MAIL_BUSINESS]: getEncryption(),
                [PLANS.BUNDLE_PRO]: getEncryption(),
                [PLANS.BUNDLE_PRO_2024]: getEncryption(),
                [PLANS.PASS_PRO]: getEncryption(),
                [PLANS.PASS_BUSINESS]: getEncryption(),
                [PLANS.VPN_PRO]: getEncryption(),
                [PLANS.VPN_BUSINESS]: getEncryption(),
            },
        },
        {
            name: 'router',
            plans: {
                [PLANS.FREE]: getRouterSupport(),
                [PLANS.BUNDLE]: getRouterSupport(),
                [PLANS.MAIL]: getRouterSupport(),
                [PLANS.VPN]: getRouterSupport(),
                [PLANS.DRIVE]: getRouterSupport(),
                [PLANS.DRIVE_BUSINESS]: getRouterSupport(),
                [PLANS.PASS]: getRouterSupport(),
                [PLANS.WALLET]: getRouterSupport(),
                [PLANS.FAMILY]: getRouterSupport(),
                [PLANS.DUO]: getRouterSupport(),
                [PLANS.MAIL_PRO]: getRouterSupport(),
                [PLANS.MAIL_BUSINESS]: getRouterSupport(),
                [PLANS.BUNDLE_PRO]: getRouterSupport(),
                [PLANS.BUNDLE_PRO_2024]: getRouterSupport(),
                [PLANS.PASS_PRO]: getRouterSupport(),
                [PLANS.PASS_BUSINESS]: getRouterSupport(),
                [PLANS.VPN_PRO]: getRouterSupport(),
                [PLANS.VPN_BUSINESS]: getRouterSupport(),
            },
        },
        {
            name: 'split-tunnel',
            plans: {
                [PLANS.FREE]: getSplitTunnel(false),
                [PLANS.BUNDLE]: getSplitTunnel(true),
                [PLANS.MAIL]: getSplitTunnel(false),
                [PLANS.VPN]: getSplitTunnel(true),
                [PLANS.DRIVE]: getSplitTunnel(false),
                [PLANS.DRIVE_BUSINESS]: getSplitTunnel(false),
                [PLANS.PASS]: getSplitTunnel(false),
                [PLANS.WALLET]: getSplitTunnel(false),
                [PLANS.FAMILY]: getSplitTunnel(true),
                [PLANS.DUO]: getSplitTunnel(true),
                [PLANS.MAIL_PRO]: getSplitTunnel(false),
                [PLANS.MAIL_BUSINESS]: getSplitTunnel(false),
                [PLANS.BUNDLE_PRO]: getSplitTunnel(true),
                [PLANS.BUNDLE_PRO_2024]: getSplitTunnel(true),
                [PLANS.PASS_PRO]: getSplitTunnel(false),
                [PLANS.PASS_BUSINESS]: getSplitTunnel(false),
                [PLANS.VPN_PRO]: getSplitTunnel(true),
                [PLANS.VPN_BUSINESS]: getSplitTunnel(true),
            },
        },
    ];
};
