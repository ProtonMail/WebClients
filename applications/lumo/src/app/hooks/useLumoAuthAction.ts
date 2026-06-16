import { useCallback } from 'react';

import type { NativeAccountAction } from '../remote/nativeAuthBridge';
import { isNativeAuthBridgeAvailable, triggerNativeAccountAction } from '../remote/nativeAuthBridgeHelpers';
import { canUseNativeAuth, isNativeMobileApp } from '../util/userAgent';
import { useLumoFlags } from './useLumoFlags';

export type AuthAction = 'signin' | 'signup' | 'signout' | 'addaccount';

const ACTION_TO_NATIVE: Record<AuthAction, NativeAccountAction> = {
    signin: 'LogIn',
    signup: 'SignUp',
    signout: 'SignOut',
    addaccount: 'AddAccount',
};

export const useLumoAuthAction = () => {
    const isMobileApp = isNativeMobileApp();
    const flagEnabled = useLumoFlags().lumoNativeAuth;
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
