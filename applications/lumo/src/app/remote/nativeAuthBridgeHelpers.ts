import type { NativeAccountAction } from './nativeAuthBridge';

export const isNativeAuthBridgeAvailable = (): boolean => {
    const instance = (window as any).nativeAuthApiInstance;
    return !!instance && typeof instance.onAccountAction === 'function';
};

export const triggerNativeAccountAction = (action: NativeAccountAction): void => {
    const instance = (window as any).nativeAuthApiInstance;
    if (!instance || typeof instance.onAccountAction !== 'function') {
        console.warn('Native Auth Bridge: instance not available');
        return;
    }
    instance.onAccountAction(action);
};
