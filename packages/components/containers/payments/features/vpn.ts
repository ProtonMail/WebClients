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
import { Audience, VPNServersCountData } from '@proton/shared/lib/interfaces';
import { getFreeServers, getPlusServers } from '@proton/shared/lib/vpn/features';

import { PlanCardFeature, PlanCardFeatureDefinition } from './interface';

export const getFreeVPNConnectionTotal = () => c('new_plans: feature').t`1 free VPN connection in total`;

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

export const getVPNAppFeature = (options?: { family?: boolean }): PlanCardFeatureDefinition => {
    return {
        text: VPN_APP_NAME,
        tooltip: options?.family
            ? c('new_plans: tooltip')
                  .t`Protect your family from harmful websites and access our high-speed VPN servers to stream your favorite content`
            : c('new_plans: tooltip').t`${VPN_APP_NAME}: unblock content, browse privately`,
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
            .t`Access to Secure core servers, fast P2P/BitTorrent downloads, Tor over VPN, Double hop, and more.`,
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
        text: c('new_plans: feature').t`Ad-blocker & malware protection`,
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
    const BRAND_NAME_TWO = BRAND_NAME;

    return {
        text:
            n === 1
                ? getFreeVPNConnectionTotal()
                : c('new_plans: feature').ngettext(
                      msgid`${n} VPN connection per user`,
                      `${n} VPN connections per user`,
                      n
                  ),
        tooltip: c('new_plans: tooltip')
            .t`One VPN connection allows one device to connect to ${BRAND_NAME} VPN at any given time. For instance, to connect a phone and a laptop to ${BRAND_NAME_TWO} VPN at the same time, you need two VPN connections.`,
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
const getSplitTunnel = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Split tunneling (Android and Windows)`,
        tooltip: c('new_plans: tooltip')
            .t`Allows you to access more than one network at the same time, e.g., stream a film from another country while still getting local search results`,
        included: true,
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

export const getDedicatedServersVPNFeature = (n?: number): PlanCardFeatureDefinition => {
    let text: string;

    if (n === undefined) {
        text = c('new_plans: Upsell attribute').t`Dedicated server locations in North America and Europe`;
    } else {
        text = c('new_plans: Upsell attribute').t`Dedicated server locations in ${n}+ countries`;
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
                [PLANS.PASS_PLUS]: getVPNConnections(FREE_VPN_CONNECTIONS),
                [PLANS.FAMILY]: getVPNConnections(VPN_CONNECTIONS),
                [PLANS.MAIL_PRO]: getVPNConnections(FREE_VPN_CONNECTIONS),
                [PLANS.BUNDLE_PRO]: getVPNConnections(VPN_CONNECTIONS),
                [PLANS.VPN_PRO]: getVPNConnections(VPN_CONNECTIONS),
                [PLANS.VPN_BUSINESS]: getVPNConnections(VPN_CONNECTIONS),
            },
        },
        {
            name: 'vpn-connections-per-user',
            target: Audience.B2B,
            plans: {
                [PLANS.FREE]: getVPNConnectionsB2B(1),
                [PLANS.BUNDLE]: getVPNConnectionsB2B(VPN_CONNECTIONS),
                [PLANS.MAIL]: getVPNConnectionsB2B(1),
                [PLANS.VPN]: getVPNConnectionsB2B(VPN_CONNECTIONS),
                [PLANS.DRIVE]: getVPNConnectionsB2B(1),
                [PLANS.PASS_PLUS]: getVPNConnectionsB2B(1),
                [PLANS.FAMILY]: getVPNConnectionsB2B(1),
                [PLANS.MAIL_PRO]: getVPNConnectionsB2B(1),
                [PLANS.BUNDLE_PRO]: getVPNConnectionsB2B(VPN_CONNECTIONS),
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
                [PLANS.PASS_PLUS]: getVPNConnections(1),
                [PLANS.FAMILY]: getVPNConnectionsB2B(VPN_CONNECTIONS),
                [PLANS.MAIL_PRO]: getVPNConnectionsB2B(1),
                [PLANS.BUNDLE_PRO]: getVPNConnectionsB2B(VPN_CONNECTIONS),
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
                [PLANS.PASS_PLUS]: getCountries(freeServers),
                [PLANS.FAMILY]: getCountries(plusServers),
                [PLANS.MAIL_PRO]: getCountries(freeServers),
                [PLANS.BUNDLE_PRO]: getCountries(plusServers),
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
                [PLANS.PASS_PLUS]: getVPNSpeed('medium'),
                [PLANS.FAMILY]: getVPNSpeed('highest'),
                [PLANS.MAIL_PRO]: getVPNSpeed('medium'),
                [PLANS.BUNDLE_PRO]: getVPNSpeed('highest'),
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
                [PLANS.PASS_PLUS]: getNetShield(false),
                [PLANS.FAMILY]: getNetShield(true),
                [PLANS.MAIL_PRO]: getNetShield(false),
                [PLANS.BUNDLE_PRO]: getNetShield(true),
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
                [PLANS.PASS_PLUS]: getStreaming(false),
                [PLANS.FAMILY]: getStreaming(true),
                [PLANS.MAIL_PRO]: getStreaming(false),
                [PLANS.BUNDLE_PRO]: getStreaming(true),
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
                [PLANS.PASS_PLUS]: getP2P(false),
                [PLANS.FAMILY]: getP2P(true),
                [PLANS.MAIL_PRO]: getP2P(false),
                [PLANS.BUNDLE_PRO]: getP2P(true),
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
                [PLANS.PASS_PLUS]: getDoubleHop(false),
                [PLANS.FAMILY]: getDoubleHop(true, true),
                [PLANS.MAIL_PRO]: getDoubleHop(false),
                [PLANS.BUNDLE_PRO]: getDoubleHop(true, true),
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
                [PLANS.PASS_PLUS]: getSecureCore(false),
                [PLANS.FAMILY]: getSecureCore(true),
                [PLANS.MAIL_PRO]: getSecureCore(false),
                [PLANS.BUNDLE_PRO]: getSecureCore(true),
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
                [PLANS.PASS_PLUS]: getTor(false),
                [PLANS.FAMILY]: getTor(true),
                [PLANS.MAIL_PRO]: getTor(false),
                [PLANS.BUNDLE_PRO]: getTor(true),
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
                [PLANS.PASS_PLUS]: getNoLogs(),
                [PLANS.FAMILY]: getNoLogs(),
                [PLANS.MAIL_PRO]: getNoLogs(),
                [PLANS.BUNDLE_PRO]: getNoLogs(),
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
                [PLANS.PASS_PLUS]: getBandwidth(),
                [PLANS.FAMILY]: getBandwidth(),
                [PLANS.MAIL_PRO]: getBandwidth(),
                [PLANS.BUNDLE_PRO]: getBandwidth(),
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
                [PLANS.PASS_PLUS]: getDNSLeak(),
                [PLANS.FAMILY]: getDNSLeak(),
                [PLANS.MAIL_PRO]: getDNSLeak(),
                [PLANS.BUNDLE_PRO]: getDNSLeak(),
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
                [PLANS.PASS_PLUS]: getKillSwitch(),
                [PLANS.FAMILY]: getKillSwitch(),
                [PLANS.MAIL_PRO]: getKillSwitch(),
                [PLANS.BUNDLE_PRO]: getKillSwitch(),
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
                [PLANS.PASS_PLUS]: getEncryption(),
                [PLANS.FAMILY]: getEncryption(),
                [PLANS.MAIL_PRO]: getEncryption(),
                [PLANS.BUNDLE_PRO]: getEncryption(),
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
                [PLANS.PASS_PLUS]: getRouterSupport(),
                [PLANS.FAMILY]: getRouterSupport(),
                [PLANS.MAIL_PRO]: getRouterSupport(),
                [PLANS.BUNDLE_PRO]: getRouterSupport(),
                [PLANS.VPN_PRO]: getRouterSupport(),
                [PLANS.VPN_BUSINESS]: getRouterSupport(),
            },
        },
        {
            name: 'split-tunnel',
            plans: {
                [PLANS.FREE]: getSplitTunnel(),
                [PLANS.BUNDLE]: getSplitTunnel(),
                [PLANS.MAIL]: getSplitTunnel(),
                [PLANS.VPN]: getSplitTunnel(),
                [PLANS.DRIVE]: getSplitTunnel(),
                [PLANS.PASS_PLUS]: getSplitTunnel(),
                [PLANS.FAMILY]: getSplitTunnel(),
                [PLANS.MAIL_PRO]: getSplitTunnel(),
                [PLANS.BUNDLE_PRO]: getSplitTunnel(),
                [PLANS.VPN_PRO]: getSplitTunnel(),
                [PLANS.VPN_BUSINESS]: getSplitTunnel(),
            },
        },
    ];
};
