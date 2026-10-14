import { useEffect, useRef } from 'react';

import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { selectJoinedRoom } from '@proton/meet/store/slices/connectionSlice';
import { selectUserSettings, updateLiveCaptionsLocaleThunk } from '@proton/meet/store/slices/userSettings';
import { selectIsGuest } from '@proton/meet/store/slices/userSlice';
import { useFlag } from '@proton/unleash/useFlag';
import noop from '@proton/utils/noop';

import {
    DEFAULT_CAPTION_LANGUAGE,
    getCaptionLanguageForLocale,
    getCaptionLocaleForLanguage,
} from '../../utils/captionLanguages';
import { useLatest } from '../useLatest';
import { useLocalParticipantAttribute } from '../useLocalParticipantAttribute';
import { useStableCallback } from '../useStableCallback';

const CAPTION_LANGUAGE_ATTR = 'caption_language';

/** The agent auto-detects when the attribute is unset. */
const toAttributeValue = (language: string) => (language === DEFAULT_CAPTION_LANGUAGE ? '' : language);

/** Guests have no Meet user settings, so their choice does not outlive the meeting. */
const useHasUserSettings = () => {
    const isGuest = useMeetSelector(selectIsGuest);
    const canSaveToUserSettings = useFlag('MeetSaveCaptionLanguagePreference');

    return !isGuest && canSaveToUserSettings;
};

const useSavedCaptionLanguage = () => {
    const hasUserSettings = useHasUserSettings();
    const locale = useMeetSelector((state) => selectUserSettings(state).value?.LiveCaptionsLocale);

    if (!hasUserSettings) {
        return DEFAULT_CAPTION_LANGUAGE;
    }

    return getCaptionLanguageForLocale(locale ?? '');
};

const useCaptionLanguagePreference = () => {
    const dispatch = useMeetDispatch();
    const hasUserSettings = useHasUserSettings();

    const setPreference = useStableCallback(async (language: string) => {
        if (!hasUserSettings) {
            return;
        }

        await dispatch(updateLiveCaptionsLocaleThunk(getCaptionLocaleForLanguage(language))).unwrap();
    });

    return { setPreference };
};

/**
 * Attributes live on the participant, so they are gone on the next join and the stored preference
 * has to be published again. Only the attribute drives the picker and the agent, so this runs once
 * per join: re-publishing whenever it empties would undo a switch back to auto-detect.
 */
export const useRestoreCaptionLanguage = () => {
    const joinedRoom = useMeetSelector(selectJoinedRoom);
    const savedLanguage = useSavedCaptionLanguage();
    const { value, setValue } = useLocalParticipantAttribute(CAPTION_LANGUAGE_ATTR);
    const publishedRef = useLatest(value);
    const restored = useRef(false);

    useEffect(() => {
        if (!joinedRoom) {
            restored.current = false;
            return;
        }

        // Waits for the settings rather than restoring the default over them, since they load in.
        if (restored.current || publishedRef.current || savedLanguage === DEFAULT_CAPTION_LANGUAGE) {
            return;
        }

        restored.current = true;

        // A refused publish only costs auto-detection, and the picker still shows what the room has.
        void setValue(toAttributeValue(savedLanguage)).catch(noop);
    }, [joinedRoom, savedLanguage, setValue, publishedRef]);
};

export const useCaptionLanguage = () => {
    const { value, setValue } = useLocalParticipantAttribute(CAPTION_LANGUAGE_ATTR);
    const { setPreference } = useCaptionLanguagePreference();

    return {
        language: value || DEFAULT_CAPTION_LANGUAGE,
        setLanguage: async (next: string) => {
            await setValue(toAttributeValue(next));
            // Only after the room accepted it, so a failed change isn't the one we save.
            await setPreference(next);
        },
    };
};
