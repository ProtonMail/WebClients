import { useCallback } from 'react';

import type { NativeAccountAction } from '../remote/nativeAuthBridge';
import { isNativeAuthBridgeAvailable, triggerNativeAccountAction } from '../remote/nativeAuthBridgeHelpers';
import { canUseNativeAuth, isNativeAuthFlagEnabled, isNativeMobileApp } from '../util/userAgent';
import { useLumoFlags } from './useLumoFlags';

export type AuthAction = 'signin' | 'signup' | 'signout' | 'addaccount' | 'webaccountsettings';

const ACTION_TO_NATIVE: Record<AuthAction, NativeAccountAction> = {
    signin: 'LogIn',
    signup: 'SignUp',
    signout: 'SignOut',
    addaccount: 'AddAccount',
    webaccountsettings: 'WebAccountSettings',
};

export const useLumoAuthAction = () => {
    const isMobileApp = isNativeMobileApp();
    const { lumoNativeAuthAndroid, lumoNativeAuthIOS } = useLumoFlags();
    // Gated per platform so Android and iOS can be rolled out independently.
    const flagEnabled = isNativeAuthFlagEnabled({ android: lumoNativeAuthAndroid, ios: lumoNativeAuthIOS });
    const bridgeAvailable = isNativeAuthBridgeAvailable();
    const isNativeAuthEnabled = canUseNativeAuth();
    const isEnabled = isMobileApp && flagEnabled && bridgeAvailable && isNativeAuthEnabled;

    const trigger = useCallback(
        (action: AuthAction) => {
            if (isEnabled) {
                triggerNativeAccountAction(ACTION_TO_NATIVE[action]);
            }
        },
        [isMobileApp, flagEnabled, bridgeAvailable, isNativeAuthEnabled]
    );

    return { isEnabled, trigger };
};
