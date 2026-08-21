import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { updateUserSettingsThunk } from '@proton/meet/store/slices/userSettings';
import { selectIsGuest } from '@proton/meet/store/slices/userSlice';
import { useFlag } from '@proton/unleash/useFlag';

import { DEFAULT_CAPTION_LANGUAGE } from '../../utils/captionLanguages';
import { useLocalParticipantAttribute } from '../useLocalParticipantAttribute';
import { useStableCallback } from '../useStableCallback';

export const CAPTION_LANGUAGE_ATTR = 'caption_language';

/** The agent auto-detects when the attribute is unset. */
const toAttributeValue = (language: string) => (language === DEFAULT_CAPTION_LANGUAGE ? '' : language);

/** Guests have no Meet user settings, so their choice does not outlive the meeting. */
const useCaptionLanguagePreference = () => {
    const dispatch = useMeetDispatch();
    const isGuest = useMeetSelector(selectIsGuest);
    const canSaveToUserSettings = useFlag('MeetSaveCaptionLanguagePreference');

    const setPreference = useStableCallback(async (language: string) => {
        if (isGuest) {
            return;
        }

        if (!canSaveToUserSettings) {
            return;
        }

        await dispatch(updateUserSettingsThunk({ CaptionLanguage: language })).unwrap();
    });

    return { setPreference };
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
