import { useCallback, useState } from 'react';

import { useTheme } from '@proton/components';
import { MotionModeSetting } from '@proton/shared/lib/themes/constants';

import { resolveAnimatedBackgroundEnabled } from '../lib/animatedBackground/resolveAnimatedBackgroundEnabled';
import {
    DEFAULT_ANIMATED_BACKGROUND_BLOB_MODE,
    type AnimatedBackgroundBlobMode,
} from '../lib/webgl/animatedBackgroundConfig';
import { getLumoSettings, setLumoSettings } from '../providers';
import { useIsGuest } from '../providers/IsGuestProvider';
import { useLumoSelector } from '../redux/hooks';
import { useLumoUserSettings } from './useLumoUserSettings';

export type { AnimatedBackgroundBlobMode };

function readLocalBlobMode(): AnimatedBackgroundBlobMode {
    const mode = getLumoSettings()?.animatedBackgroundBlobMode;
    return mode === 'lavaLamp' ? 'lavaLamp' : DEFAULT_ANIMATED_BACKGROUND_BLOB_MODE;
}

export const useLumoAnimatedBackground = () => {
    const { information } = useTheme();
    const isGuest = useIsGuest();
    const { lumoUserSettings, updateSettings } = useLumoUserSettings();
    const reduxBlobMode = useLumoSelector((state) => state.lumoUserSettings.animatedBackgroundBlobMode);
    const [guestBlobMode, setGuestBlobMode] = useState(readLocalBlobMode);
    const [guestEnabled, setGuestEnabled] = useState(() => getLumoSettings()?.animatedBackgroundEnabled);

    const animatedBackgroundBlobMode = isGuest
        ? guestBlobMode
        : reduxBlobMode === 'lavaLamp' || reduxBlobMode === 'ambient'
          ? reduxBlobMode
          : readLocalBlobMode();
    const isLavaLampMode = animatedBackgroundBlobMode === 'lavaLamp';

    const isAnimatedBackgroundEnabled = resolveAnimatedBackgroundEnabled({
        accountAnimationsDisabled: information.features.animations,
        osReduceMotion: information.motionMode === MotionModeSetting.Reduce,
        lumoAnimatedBackgroundEnabled: isGuest
            ? guestEnabled
            : (lumoUserSettings.animatedBackgroundEnabled ?? getLumoSettings()?.animatedBackgroundEnabled),
    });

    const setAnimatedBackgroundEnabled = useCallback(
        (enabled: boolean) => {
            setLumoSettings({ animatedBackgroundEnabled: enabled });
            if (isGuest) {
                setGuestEnabled(enabled);
                return;
            }
            updateSettings({
                animatedBackgroundEnabled: enabled,
                _autoSave: true,
            });
        },
        [isGuest, updateSettings]
    );

    const setAnimatedBackgroundBlobMode = useCallback(
        (mode: AnimatedBackgroundBlobMode) => {
            setLumoSettings({ animatedBackgroundBlobMode: mode });
            if (isGuest) {
                setGuestBlobMode(mode);
                return;
            }
            updateSettings({
                animatedBackgroundBlobMode: mode,
                _autoSave: true,
            });
        },
        [isGuest, updateSettings]
    );

    const setLavaLampModeEnabled = useCallback(
        (enabled: boolean) => {
            setAnimatedBackgroundBlobMode(enabled ? 'lavaLamp' : 'ambient');
        },
        [setAnimatedBackgroundBlobMode]
    );

    return {
        isAnimatedBackgroundEnabled,
        animatedBackgroundBlobMode,
        isLavaLampMode,
        isToggleDisabled: information.motionMode === MotionModeSetting.Reduce,
        setAnimatedBackgroundEnabled,
        setAnimatedBackgroundBlobMode,
        setLavaLampModeEnabled,
    };
};
