import { c, msgid } from 'ttag';
import { PLANS, VPN_APP_NAME, VPN_CONNECTIONS } from '@proton/shared/lib/constants';
import { getFreeServers, getPlusServers } from '@proton/shared/lib/vpn/features';
import { Audience, VPNCountries, VPNServers } from '@proton/shared/lib/interfaces';

import { PlanCardFeature, PlanCardFeatureDefinition } from './interface';

export const getFreeVPNConnectionTotal = () => c('new_plans: feature').t`1 free VPN connection in total`;

export const getB2BHighSpeedVPNConnectionsText = (n: number) => {
    return c('Subscription attribute').ngettext(
        msgid`${n} high-speed VPN connection per user`,
        `${n} high-speed VPN connections per user`,
        n
    );
};

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

export const getVPNConnectionsText = (n: number) => {
    return c('Subscription attribute').ngettext(msgid`${n} VPN connection`, `${n} VPN connections`, n);
};

export const getB2BHighSpeedVPNConnections = (): PlanCardFeatureDefinition => {
    return {
        featureName: getB2BHighSpeedVPNConnectionsText(VPN_CONNECTIONS),
        tooltip: '',
        included: true,
        icon: 'brand-proton-vpn',
    };
};

export const getVPNAppFeature = (): PlanCardFeatureDefinition => {
    return {
        featureName: VPN_APP_NAME,
        tooltip: c('new_plans: tooltip').t`Advanced security VPN with global network`,
        included: true,
        icon: 'brand-proton-vpn',
    };
};

export const getCountries = (featureName: string, fire?: boolean): PlanCardFeatureDefinition => {
    return {
        featureName,
        tooltip: '',
        included: true,
        fire,
        icon: 'earth',
    };
};

export const getVPNSpeed = (type: 'medium' | 'highest', fire?: boolean): PlanCardFeatureDefinition => {
    return {
        featureName: type === 'medium' ? c('new_plans').t`Medium VPN speed` : c('new_plans').t`Highest VPN speed`,
        tooltip: '',
        included: true,
        fire,
        icon: 'chevrons-right',
    };
};

export const getStreaming = (included: boolean, fire?: boolean): PlanCardFeatureDefinition => {
    return {
        featureName: c('new_plans: feature').t`Worldwide streaming services`,
        tooltip: c('new_plans: tooltip')
            .t`Access content on streaming services, including Netflix, Disney+, and Prime Video, from anywhere`,
        included,
        fire,
        icon: 'play',
    };
};

export const getP2P = (included: boolean, fire?: boolean): PlanCardFeatureDefinition => {
    return {
        featureName: c('new_plans: feature').t`P2P/BitTorrent`,
        tooltip: c('new_plans: tooltip').t`Support for file-sharing protocols like BitTorrent`,
        included,
        fire,
        icon: 'arrows-switch',
    };
};

export const getNetShield = (included: boolean, fire?: boolean): PlanCardFeatureDefinition => {
    return {
        featureName: c('new_plans: feature').t`NetShield malware and ad-blocker`,
        tooltip: c('new_plans: tooltip')
            .t`Specially designed NetShield protects your device and speeds up your browsing by blocking ads, trackers, and malware`,
        included,
        fire,
        icon: 'shield',
    };
};
export const getSecureCore = (included: boolean, fire?: boolean): PlanCardFeatureDefinition => {
    return {
        featureName: c('new_plans: feature').t`Secure Core servers`,
        tooltip: c('new_plans: tooltip')
            .t`Defends against the threat to VPN privacy by passing your internet traffic through multiple servers`,
        included,
        fire,
        icon: 'servers',
    };
};
export const getTor = (included: boolean, fire?: boolean): PlanCardFeatureDefinition => {
    return {
        featureName: c('new_plans: feature').t`Tor over VPN`,
        tooltip: c('new_plans: tooltip').t`Route your internet traffic through the Tor network with a single click`,
        included,
        fire,
        icon: 'brand-tor',
    };
};

const getVPNConnectionsB2B = (n = 0, fire?: boolean): PlanCardFeatureDefinition => {
    return {
        featureName:
            n === 1
                ? getFreeVPNConnectionTotal()
                : c('new_plans: feature').ngettext(
                      msgid`${n} VPN connection per user`,
                      `${n} VPN connections per user`,
                      n
                  ),
        tooltip: c('new_plans: tooltip')
            .t`One VPN connection allows one device to connect to Proton VPN at any given time. For instance, to connect a phone and a laptop to Proton VPN at the same time, you need two VPN connections.`,
        included: true,
        fire,
        icon: 'brand-proton-vpn',
    };
};
export const getVPNConnections = (n = 0, fire?: boolean): PlanCardFeatureDefinition => {
    return {
        featureName: c('new_plans: feature').ngettext(msgid`${n} VPN connection`, `${n} VPN connections`, n),
        tooltip: '',
        included: true,
        fire,
        icon: 'brand-proton-vpn',
    };
};
export const getNoLogs = (fire?: boolean): PlanCardFeatureDefinition => {
    return {
        featureName: c('new_plans: feature').t`Strict no-logs policy`,
        tooltip: c('new_plans: tooltip')
            .t`We keep no session usage logs of what you do online, and we do not log metadata that can compromise your privacy`,
        included: true,
        fire,
        icon: 'alias',
    };
};
const getBandwidth = (): PlanCardFeatureDefinition => {
    return {
        featureName: c('new_plans: feature').t`Unlimited volume/bandwidth`,
        tooltip: '',
        included: true,
    };
};
const getDNSLeak = (): PlanCardFeatureDefinition => {
    return {
        featureName: c('new_plans: feature').t`DNS leak prevention`,
        tooltip: c('new_plans: tooltip')
            .t`When connected to our VPN, your DNS queries through our encrypted VPN tunnel, adding to your online privacy and security`,
        included: true,
    };
};
const getKillSwitch = (): PlanCardFeatureDefinition => {
    return {
        featureName: c('new_plans: feature').t`Kill switch/always-on VPN`,
        tooltip: c('new_plans: tooltip')
            .t`Keeps you protected by blocking all network connections when you are unexpectedly disconnected from our VPN server.`,
        included: true,
    };
};
const getEncryption = (): PlanCardFeatureDefinition => {
    return {
        featureName: c('new_plans: feature').t`Encrypted VPN servers`,
        tooltip: c('new_plans: tooltip')
            .t`Our servers’ hard disks are fully encrypted with multiple password layers so your data is protected even if our hardware is compromised`,
        included: true,
    };
};
const getRouterSupport = (): PlanCardFeatureDefinition => {
    return {
        featureName: c('new_plans: feature').t`Router support`,
        tooltip: c('new_plans: tooltip')
            .t`Protect every device connected to your WiFi network. It’s also useful if you have devices that do not support VPN settings directly.`,
        included: true,
    };
};
const getSplitTunnel = (): PlanCardFeatureDefinition => {
    return {
        featureName: c('new_plans: feature').t`Split tunneling (Android and Windows)`,
        tooltip: c('new_plans: tooltip')
            .t`Allows you to access more than one network at the same time, e.g., stream a film from another country while still getting local search results`,
        included: true,
    };
};
export const getVPNDevices = (n: number): PlanCardFeatureDefinition => {
    if (n === 1) {
        return {
            featureName: c('new_plans: feature').t`Free VPN on a single device`,
            tooltip: c('new_plans: tooltip')
                .t`Allows you to access more than one network at the same time, e.g., stream a film from another country while still getting local search results`,
            included: true,
        };
    }
    return {
        featureName: c('new_plans: feature').ngettext(
            msgid`High-speed VPN on ${n} device`,
            `High-speed VPN on ${n} devices`,
            n
        ),
        tooltip: '',
        included: true,
    };
};

export const getVPNFeatures = (vpnCountries: VPNCountries, serversCount: VPNServers): PlanCardFeature[] => {
    const freeServers = getFreeServers(serversCount.free_vpn, vpnCountries.free_vpn.count);
    const plusServers = getPlusServers(serversCount[PLANS.VPN], vpnCountries[PLANS.VPN].count);
    return [
        {
            name: 'vpn',
            target: Audience.B2C,
            plans: {
                [PLANS.FREE]: getVPNConnections(1),
                [PLANS.BUNDLE]: getVPNConnections(VPN_CONNECTIONS, true),
                [PLANS.MAIL]: getVPNConnections(1),
                [PLANS.VPN]: getVPNConnections(VPN_CONNECTIONS, true),
                [PLANS.DRIVE]: getVPNConnections(1),
                [PLANS.FAMILY]: getVPNConnections(VPN_CONNECTIONS),
                [PLANS.MAIL_PRO]: getVPNConnections(1),
                [PLANS.BUNDLE_PRO]: getVPNConnections(VPN_CONNECTIONS, true),
            },
        },
        {
            name: 'vpn-connections-per-user',
            target: Audience.B2B,
            plans: {
                [PLANS.FREE]: getVPNConnectionsB2B(1),
                [PLANS.BUNDLE]: getVPNConnectionsB2B(VPN_CONNECTIONS, true),
                [PLANS.MAIL]: getVPNConnectionsB2B(1),
                [PLANS.VPN]: getVPNConnectionsB2B(VPN_CONNECTIONS, true),
                [PLANS.DRIVE]: getVPNConnectionsB2B(1),
                [PLANS.FAMILY]: getVPNConnectionsB2B(1),
                [PLANS.MAIL_PRO]: getVPNConnectionsB2B(1),
                [PLANS.BUNDLE_PRO]: getVPNConnectionsB2B(VPN_CONNECTIONS, true),
            },
        },
        {
            name: 'countries',
            plans: {
                [PLANS.FREE]: getCountries(freeServers),
                [PLANS.BUNDLE]: getCountries(plusServers, true),
                [PLANS.MAIL]: getCountries(freeServers),
                [PLANS.VPN]: getCountries(plusServers, true),
                [PLANS.DRIVE]: getCountries(freeServers),
                [PLANS.FAMILY]: getCountries(plusServers),
                [PLANS.MAIL_PRO]: getCountries(freeServers),
                [PLANS.BUNDLE_PRO]: getCountries(plusServers, true),
            },
        },
        {
            name: 'vpn-speed',
            plans: {
                [PLANS.FREE]: getVPNSpeed('medium'),
                [PLANS.BUNDLE]: getVPNSpeed('highest', true),
                [PLANS.MAIL]: getVPNSpeed('medium'),
                [PLANS.VPN]: getVPNSpeed('highest', true),
                [PLANS.DRIVE]: getVPNSpeed('medium'),
                [PLANS.FAMILY]: getVPNSpeed('highest'),
                [PLANS.MAIL_PRO]: getVPNSpeed('medium'),
                [PLANS.BUNDLE_PRO]: getVPNSpeed('highest', true),
            },
        },
        {
            name: 'netshield',
            plans: {
                [PLANS.FREE]: getNetShield(false),
                [PLANS.BUNDLE]: getNetShield(true, true),
                [PLANS.MAIL]: getNetShield(false),
                [PLANS.VPN]: getNetShield(true, true),
                [PLANS.DRIVE]: getNetShield(false),
                [PLANS.FAMILY]: getNetShield(true),
                [PLANS.MAIL_PRO]: getNetShield(false),
                [PLANS.BUNDLE_PRO]: getNetShield(true, true),
            },
        },
        {
            name: 'streaming',
            plans: {
                [PLANS.FREE]: getStreaming(false),
                [PLANS.BUNDLE]: getStreaming(true, true),
                [PLANS.MAIL]: getStreaming(false),
                [PLANS.VPN]: getStreaming(true, true),
                [PLANS.DRIVE]: getStreaming(false),
                [PLANS.FAMILY]: getStreaming(true),
                [PLANS.MAIL_PRO]: getStreaming(false),
                [PLANS.BUNDLE_PRO]: getStreaming(true, true),
            },
        },
        {
            name: 'p2p',
            plans: {
                [PLANS.FREE]: getP2P(false),
                [PLANS.BUNDLE]: getP2P(true, true),
                [PLANS.MAIL]: getP2P(false),
                [PLANS.VPN]: getP2P(true, true),
                [PLANS.DRIVE]: getP2P(false),
                [PLANS.FAMILY]: getP2P(true),
                [PLANS.MAIL_PRO]: getP2P(false),
                [PLANS.BUNDLE_PRO]: getP2P(true, true),
            },
        },
        {
            name: 'secure',
            plans: {
                [PLANS.FREE]: getSecureCore(false),
                [PLANS.BUNDLE]: getSecureCore(true, true),
                [PLANS.MAIL]: getSecureCore(false),
                [PLANS.VPN]: getSecureCore(true, true),
                [PLANS.DRIVE]: getSecureCore(false),
                [PLANS.FAMILY]: getSecureCore(true),
                [PLANS.MAIL_PRO]: getSecureCore(false),
                [PLANS.BUNDLE_PRO]: getSecureCore(true, true),
            },
        },
        {
            name: 'tor',
            plans: {
                [PLANS.FREE]: getTor(false),
                [PLANS.BUNDLE]: getTor(true, true),
                [PLANS.MAIL]: getTor(false),
                [PLANS.VPN]: getTor(true, true),
                [PLANS.DRIVE]: getTor(false),
                [PLANS.FAMILY]: getTor(true),
                [PLANS.MAIL_PRO]: getTor(false),
                [PLANS.BUNDLE_PRO]: getTor(true, true),
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
                [PLANS.FAMILY]: getNoLogs(),
                [PLANS.MAIL_PRO]: getNoLogs(),
                [PLANS.BUNDLE_PRO]: getNoLogs(),
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
                [PLANS.FAMILY]: getBandwidth(),
                [PLANS.MAIL_PRO]: getBandwidth(),
                [PLANS.BUNDLE_PRO]: getBandwidth(),
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
                [PLANS.FAMILY]: getDNSLeak(),
                [PLANS.MAIL_PRO]: getDNSLeak(),
                [PLANS.BUNDLE_PRO]: getDNSLeak(),
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
                [PLANS.FAMILY]: getKillSwitch(),
                [PLANS.MAIL_PRO]: getKillSwitch(),
                [PLANS.BUNDLE_PRO]: getKillSwitch(),
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
                [PLANS.FAMILY]: getEncryption(),
                [PLANS.MAIL_PRO]: getEncryption(),
                [PLANS.BUNDLE_PRO]: getEncryption(),
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
                [PLANS.FAMILY]: getRouterSupport(),
                [PLANS.MAIL_PRO]: getRouterSupport(),
                [PLANS.BUNDLE_PRO]: getRouterSupport(),
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
                [PLANS.FAMILY]: getSplitTunnel(),
                [PLANS.MAIL_PRO]: getSplitTunnel(),
                [PLANS.BUNDLE_PRO]: getSplitTunnel(),
            },
        },
    ];
};
