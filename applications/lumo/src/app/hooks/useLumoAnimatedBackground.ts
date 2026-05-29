import { useCallback } from 'react';

import { useTheme } from '@proton/components';
import { MotionModeSetting } from '@proton/shared/lib/themes/constants';

import { resolveAnimatedBackgroundEnabled } from '../lib/animatedBackground/resolveAnimatedBackgroundEnabled';
import { useLumoUserSettings } from './useLumoUserSettings';

export const useLumoAnimatedBackground = () => {
    const { information } = useTheme();
    const { lumoUserSettings, updateSettings } = useLumoUserSettings();

    const isAnimatedBackgroundEnabled = resolveAnimatedBackgroundEnabled({
        // `features.animations` means account-level animations are disabled.
        accountAnimationsDisabled: information.features.animations,
        osReduceMotion: information.motionMode === MotionModeSetting.Reduce,
        lumoAnimatedBackgroundEnabled: lumoUserSettings.animatedBackgroundEnabled,
    });

    const setAnimatedBackgroundEnabled = useCallback(
        (enabled: boolean) => {
            updateSettings({
                animatedBackgroundEnabled: enabled,
                _autoSave: true,
            });
        },
        [updateSettings]
    );

    return {
        isAnimatedBackgroundEnabled,
        isToggleDisabled: information.motionMode === MotionModeSetting.Reduce,
        setAnimatedBackgroundEnabled,
    };
};
