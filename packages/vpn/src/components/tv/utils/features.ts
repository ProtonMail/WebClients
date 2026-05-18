import type { PlanCardFeatureDefinition } from '@proton/components/containers/payments/features/interface';
import {
    getAccessAllCountries,
    getBandwidth,
    getDNSLeak,
    getDoubleHop,
    getEncryption,
    getKillSwitch,
    getNCountries,
    getNetShield,
    getNoLogs,
    getNoStreamingSupport,
    getP2P,
    getProtectDevices,
    getRouterSupport,
    getSplitTunnel,
    getTor,
    getUnlockStreaming,
} from '@proton/components/containers/payments/features/vpn';

export const paidFeatures: PlanCardFeatureDefinition[] = [
    getUnlockStreaming(),
    getAccessAllCountries(),
    getProtectDevices(10, false),
    getNetShield(true, false),
    getP2P(true, false),
    getDoubleHop(true, false),
    getTor(true, false),
    getNoLogs(false),
    getBandwidth(),
    getDNSLeak(),
    getKillSwitch(),
    getEncryption(),
    getRouterSupport(),
    getSplitTunnel(true),
];

export const freeFeatures: PlanCardFeatureDefinition[] = [getNCountries(10), getBandwidth(), getNoStreamingSupport()];
