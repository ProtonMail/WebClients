import { c } from 'ttag';

export interface FeaturePair<T extends number | boolean = number | boolean> {
    name: string;
    shortName?: string;
    value: T;
    transform?: (value: T) => T;
    unTransform?: (value: T) => T;
}

export interface FeatureOption<T extends number | boolean = number | boolean> extends FeaturePair<T> {
    tier?: number;
    url?: string;
}

export interface FeatureSelection<T extends number | boolean = number | boolean> extends FeatureOption<T> {
    values: FeaturePair<T>[];
}

export interface FeatureFlagsConfig {
    NetShield: boolean;
    GuestHoles: boolean;
    ServerRefresh: boolean;
    StreamingServicesLogos: boolean;
    PortForwarding: boolean;
    ModerateNAT: boolean;
    SafeMode: boolean;
    PollNotificationAPI: boolean;
    VpnAccelerator: boolean;
    SmartReconnect: boolean;
}

export interface FeaturesConfig {
    NetShieldLevel: FeatureSelection<number>;
    RandomNAT: FeatureOption<boolean>;
    PortForwarding: FeatureOption<boolean>;
    SplitTCP: FeatureOption<boolean>;
    SafeMode: FeatureOption<boolean>;
}

export interface FeaturesValues {
    NetShieldLevel?: number;
    // PortForwarding?: boolean;
    SplitTCP?: boolean;
    RandomNAT?: boolean;
    SafeMode?: boolean;
}

export const isFeatureSelection = (value: FeatureOption<any>): value is FeatureSelection<any> => {
    return 'values' in value;
};

export const initialFeaturesConfig: FeaturesConfig = {
    NetShieldLevel: {
        tier: 1,
        url: 'https://protonvpn.com/support/netshield/',
        name: c('Label').t`Level for NetShield blocker filtering`,
        shortName: 'NetShield',
        value: 1,
        values: [
            {
                name: c('Label').t`No filter`,
                value: 0,
            },
            {
                name: c('Label').t`Block malware only`,
                value: 1,
            },
            {
                name: c('Label').t`Block malware, ads and trackers`,
                value: 2,
            },
        ],
    },
    RandomNAT: {
        tier: 1,
        name: c('Label').t`Moderate NAT`,
        url: 'https://protonvpn.com/support/moderate-nat',
        value: false,
        transform: (value) => !value,
        unTransform: (value) => !value,
    },
    PortForwarding: {
        name: c('Label').t`NAT-PMP (Port Forwarding)`,
        url: 'https://protonvpn.com/support/port-forwarding',
        value: false,
    },
    SplitTCP: {
        name: c('Label').t`VPN Accelerator`,
        url: 'https://protonvpn.com/blog/vpn-accelerator/',
        value: true,
    },
    SafeMode: {
        tier: 1,
        name: c('Label').t`Non-standard ports`,
        url: 'https://protonvpn.com/support/non-standard-ports',
        value: false,
        transform: (value) => !value,
        unTransform: (value) => !value,
    },
};

export const clientConfigKeys = {
    NetShieldLevel: 'NetShield',
    RandomNAT: 'ModerateNAT',
    PortForwarding: 'PortForwarding',
    SplitTCP: 'VpnAccelerator',
    SafeMode: 'SafeMode',
} as Record<keyof FeaturesConfig, keyof FeatureFlagsConfig>;

export const formatFeatureValue = <T extends Partial<FeaturesValues>, K extends keyof T>(
    features: T | undefined,
    key: K
): string | T[K] | undefined => {
    const value = `${(
        (initialFeaturesConfig?.[key as any as keyof FeaturesConfig]?.unTransform || ((v: any) => v)) as <T>(
            value: T
        ) => T
    )(features?.[key])}`;

    return { true: 'on', false: 'off' }[value] || value;
};

export const getKeyOfCheck = <T>(keys: (keyof T)[]): (<K extends keyof T>(key: any) => key is K) =>
    ((key: any) => keys.indexOf(key) !== -1) as any;

export const formatFeatureShortName = (key: keyof FeaturesValues) =>
    initialFeaturesConfig[key]?.shortName || initialFeaturesConfig[key]?.name || key;
