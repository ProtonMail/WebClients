import type React from 'react';
import { useCallback } from 'react';

import { c } from 'ttag';

import { setNativeComposerVisibility } from '../remote/nativeComposerBridgeHelpers';
import { getAuthActionAccountPath } from '../util/authActionPath';
import { isNativeMobileApp } from '../util/userAgent';
import { useGuestMigration } from './useGuestMigration';
import { useLumoAuthAction } from './useLumoAuthAction';

export type GuestAuthAction = 'signup' | 'signin';

const AUTH_ACTIONS = {
    signup: {
        getButtonText: () => c('collider_2025: Link').t`Create a free account`,
        path: '/signup',
    },
    signin: {
        getButtonText: () => c('collider_2025: Link').t`Sign in`,
        path: '',
    },
};

/**
 * Shared behaviour of the guest "Create a free account" / "Sign in" CTAs: label, account path and
 * click handling. The guest conversation is always captured so it can be adopted after login. When
 * the native auth bridge is enabled the web navigation is cancelled and the action is delegated to
 * the native account bridge instead.
 *
 * Spread the returned `path`/`onClick` on any link-like component (`SettingsLink`, `ButtonLike` or
 * `PromotionButton` rendered `as={SettingsLink}`) so every CTA behaves identically.
 */
export const useAuthActionProps = (action: GuestAuthAction, onClick?: () => void) => {
    const config = AUTH_ACTIONS[action];

    const { captureGuestState } = useGuestMigration();
    const { isEnabled: isNativeAuthEnabled, trigger: triggerAuthAction } = useLumoAuthAction();

    const handleClick = useCallback(
        async (event: React.MouseEvent) => {
            if (isNativeAuthEnabled) {
                event.preventDefault();
            }
            onClick?.();
            setNativeComposerVisibility(false);
            try {
                const captured = await captureGuestState();
                if (captured) {
                    console.log(`Guest state captured and encrypted before ${action}`);
                }
            } catch (error) {
                console.error('Failed to capture guest state:', error);
            }
            if (isNativeAuthEnabled) {
                triggerAuthAction(action);
            }
        },
        [captureGuestState, onClick, isNativeAuthEnabled, triggerAuthAction, action]
    );

    return {
        text: config.getButtonText(),
        path: isNativeAuthEnabled
            ? ''
            : getAuthActionAccountPath({ action, basePath: config.path, isMobileApp: isNativeMobileApp() }),
        onClick: handleClick,
    };
};
