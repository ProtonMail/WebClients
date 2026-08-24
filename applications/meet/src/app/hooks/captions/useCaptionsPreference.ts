import { useLocalParticipantAttribute } from '../useLocalParticipantAttribute';
import { useStableCallback } from '../useStableCallback';

export const WANTS_CAPTIONS_ATTR = 'wants_captions';

export const useCaptionsPreference = () => {
    const { value, setValue } = useLocalParticipantAttribute(WANTS_CAPTIONS_ATTR);

    const setWantsCaptions = useStableCallback((next: boolean) => setValue(next ? 'true' : ''));

    return {
        wantsCaptions: value === 'true',
        setWantsCaptions,
    };
};
