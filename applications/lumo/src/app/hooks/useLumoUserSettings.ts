import { useCallback } from 'react';

// import { useDispatch } from 'react-redux';

import { useLumoDispatch, useLumoSelector } from '../redux/hooks';
import {
    resetLumoUserSettings,
    setLumoUserSettings,
    updateLumoUserSettings,
    updateLumoUserSettingsWithAutoSave,
} from '../redux/slices/lumoUserSettings';
import type { LumoUserSettings } from '../redux/slices/lumoUserSettings';

export function useLumoUserSettings() {
    const dispatch = useLumoDispatch();
    const lumoUserSettings = useLumoSelector((state) => state.lumoUserSettings);

    const updateSettings = useCallback(
        (settings: Partial<LumoUserSettings> & { _autoSave?: boolean }) => {
            const { _autoSave, ...cleanSettings } = settings;
            if (_autoSave) {
                dispatch(updateLumoUserSettingsWithAutoSave(cleanSettings));
            } else {
                dispatch(updateLumoUserSettings(cleanSettings));
            }
        },
        [dispatch]
    );

    const resetSettings = useCallback(() => {
        dispatch(resetLumoUserSettings());
    }, [dispatch]);

    const setSettings = useCallback(
        (settings: LumoUserSettings) => {
            dispatch(setLumoUserSettings(settings));
        },
        [dispatch]
    );

    return {
        lumoUserSettings,
        updateSettings,
        resetSettings,
        setSettings,
    };
}
