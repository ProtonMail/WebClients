import isEqual from 'lodash/isEqual';

/**
 * Native Feature Flags Bridge
 * Provides API for native clients to receive Lumo feature flag updates.
 * Similar to nativeComposerBridge.ts, but scoped to feature flags that are not
 * tied to the composer state. Flags are pushed to native via `onFeatureFlags`.
 */

export interface FeatureFlags {
    isNativeAccountEnabled: boolean;
}

/**
 * Sends the result/error of an API call back to the native side
 */
const sendResultToNative = (callId: string, payload: any) => {
    const message = { callId, ...payload };
    console.log(`Native Feature Flags Bridge: Sending message for callId ${callId}`, message);
    try {
        if ((window as any).webkit?.messageHandlers?.nativeFeatureFlagsHandler) {
            // iOS bridge
            (window as any).webkit.messageHandlers.nativeFeatureFlagsHandler.postMessage(message);
        } else if ((window as any).Android?.postMessage) {
            // Android bridge
            (window as any).Android.postMessage(JSON.stringify(message));
        } else {
            console.warn(
                `Native Feature Flags Bridge: Native bridge not detected for callId ${callId}. Payload:`,
                payload
            );
        }
    } catch (e) {
        console.error(`Native Feature Flags Bridge: Error sending message to native for callId ${callId}:`, e);
    }
};

/**
 * Sends feature flag updates to the native side
 */
const sendFeatureFlagsToNative = (featureFlags: FeatureFlags) => {
    console.log('Native Feature Flags Bridge: Sending feature flags to native', featureFlags);
    try {
        if ((window as any).webkit?.messageHandlers?.nativeFeatureFlagsHandler) {
            // iOS bridge - feature flag updates
            (window as any).webkit.messageHandlers.nativeFeatureFlagsHandler.postMessage(featureFlags);
        } else if ((window as any).Android?.onFeatureFlags) {
            // Android bridge - feature flag updates
            (window as any).Android.onFeatureFlags(JSON.stringify(featureFlags));
        } else {
            console.log('Native Feature Flags Bridge: Native bridge not detected for feature flags.', featureFlags);
        }
    } catch (e) {
        console.log('Native Feature Flags Bridge: Error sending feature flags to native:', e);
    }
};

class NativeFeatureFlagsApi {
    private featureFlags: FeatureFlags = {
        isNativeAccountEnabled: false,
    };

    constructor() {
        console.log('NativeFeatureFlagsApi instance created with default feature flags:', this.featureFlags);
    }

    /**
     * Get the current feature flags
     */
    public getFeatureFlags(): FeatureFlags {
        return { ...this.featureFlags };
    }

    /**
     * Update feature flags and notify native
     */
    private updateFeatureFlags(updates: Partial<FeatureFlags>): void {
        const newFeatureFlags = {
            ...this.featureFlags,
            ...updates,
        };

        if (!isEqual(this.featureFlags, newFeatureFlags)) {
            sendFeatureFlagsToNative(newFeatureFlags);
            this.featureFlags = newFeatureFlags;
        }
    }

    public setNativeAccountEnabled(enabled: boolean): void {
        console.log(`NativeFeatureFlagsApi: Setting native account enabled to ${enabled}`);
        this.updateFeatureFlags({ isNativeAccountEnabled: enabled });
    }
}

/**
 * Wraps a NativeFeatureFlagsApi method to be callable from native code
 */
const createNativeWrapper = (methodName: keyof NativeFeatureFlagsApi) => {
    return (callId: string, ...args: any[]) => {
        console.log(`Native Feature Flags Bridge: Received call for ${methodName} with callId ${callId}`);
        const apiInstance = (window as any).nativeFeatureFlagsApiInstance;

        if (!apiInstance) {
            const errorMsg = 'NativeFeatureFlagsApi instance not found on window.';
            console.error(`Native Feature Flags Bridge: ${errorMsg}`);
            sendResultToNative(callId, { status: 'error', error: errorMsg });
            return;
        }

        const method = apiInstance[methodName];
        if (typeof method !== 'function') {
            const errorMsg = `Method ${methodName} not found on NativeFeatureFlagsApi instance.`;
            console.error(`Native Feature Flags Bridge: ${errorMsg}`);
            sendResultToNative(callId, { status: 'error', error: errorMsg });
            return;
        }

        try {
            const result = method.apply(apiInstance, args);

            // Handle both promises and direct results
            if (result instanceof Promise) {
                result
                    .then((resData) => {
                        sendResultToNative(callId, { status: 'success', data: resData });
                    })
                    .catch((error) => {
                        const errorMessage = error instanceof Error ? error.message : String(error);
                        console.error(
                            `Native Feature Flags Bridge: Error during async ${methodName} call for callId ${callId}:`,
                            error
                        );
                        sendResultToNative(callId, { status: 'error', error: errorMessage });
                    });
            } else {
                // Handle synchronous results
                sendResultToNative(callId, { status: 'success', data: result });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(
                `Native Feature Flags Bridge: Synchronous error during ${methodName} call for callId ${callId}:`,
                error
            );
            sendResultToNative(callId, { status: 'error', error: errorMessage });
        }
    };
};

try {
    // Instantiate and expose the NativeFeatureFlagsApi
    (window as any).nativeFeatureFlagsApiInstance = new NativeFeatureFlagsApi();
    console.log(
        'Native Feature Flags Bridge: NativeFeatureFlagsApi instance created and exposed as window.nativeFeatureFlagsApiInstance'
    );

    // Expose wrapped methods for native calls
    (window as any).nativeFeatureFlagsApi = {
        // Feature flag queries
        getFeatureFlags: createNativeWrapper('getFeatureFlags'),

        // Feature flag setters
        setNativeAccountEnabled: createNativeWrapper('setNativeAccountEnabled'),
    };
    console.log('Native Feature Flags Bridge: Native wrapper functions created under window.nativeFeatureFlagsApi');

    // Send initial feature flags to native
    const initialFeatureFlags = (window as any).nativeFeatureFlagsApiInstance.getFeatureFlags();
    sendFeatureFlagsToNative(initialFeatureFlags);

    // Signal readiness
    sendResultToNative('nativeFeatureFlagsBridgeReady', {
        status: 'success',
        data: 'Native Feature Flags API bridge initialized',
    });
} catch (error) {
    console.error('Native Feature Flags Bridge: Failed to initialize NativeFeatureFlagsApi bridge:', error);
    sendResultToNative('nativeFeatureFlagsBridgeError', {
        status: 'error',
        error: 'Failed to initialize Native Feature Flags API bridge',
    });
}
