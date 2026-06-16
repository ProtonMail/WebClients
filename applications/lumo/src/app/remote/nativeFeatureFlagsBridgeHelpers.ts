import type { FeatureFlags } from './nativeFeatureFlagsBridge';

export const isNativeFeatureFlagsBridgeAvailable = (): boolean => {
    return !!(window as any).nativeFeatureFlagsApiInstance && !!(window as any).nativeFeatureFlagsApi;
};

export const setNativeIsNativeAccountEnabled = (enabled: boolean): void => {
    if (!isNativeFeatureFlagsBridgeAvailable()) {
        console.warn('Native Feature Flags Bridge not available');
        return;
    }
    (window as any).nativeFeatureFlagsApiInstance.setNativeAccountEnabled(enabled);
};

export type { FeatureFlags };
