import { useCallback } from 'react';

import { useIsGuest } from '../providers/IsGuestProvider';
import { setLumoSettings } from '../providers/lumoThemeStorage';
import {
    DICTATION_LANGUAGE_AUTO,
    type DictationLanguage,
    getDefaultDictationLanguage,
    isDictationLanguage,
} from '../util/dictationLanguages';
import { useLumoUserSettings } from './useLumoUserSettings';

/**
 * Dictation language preference. Persisted in LumoUserSettings (remote-synced) when signed in, and
 * always mirrored to localStorage (`lumo-settings`), which is the only store used for guests.
 */
export const useDictationLanguage = () => {
    const { lumoUserSettings, updateSettings } = useLumoUserSettings();
    const isGuest = useIsGuest();

    const stored = lumoUserSettings.dictationLanguage;
    const hasChosenLanguage = isDictationLanguage(stored);
    const language: DictationLanguage = isDictationLanguage(stored) ? stored : getDefaultDictationLanguage();

    const setLanguage = useCallback(
        (value: DictationLanguage) => {
            setLumoSettings({ dictationLanguage: value });
            updateSettings({ dictationLanguage: value, _autoSave: !isGuest });
        },
        [isGuest, updateSettings]
    );

    return { language, hasChosenLanguage, setLanguage, isAuto: language === DICTATION_LANGUAGE_AUTO };
};
