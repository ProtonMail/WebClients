import { useLocalParticipantAttribute } from '../useLocalParticipantAttribute';

export const WANTS_CAPTIONS_ATTR = 'wants_captions';

export const useCaptionsPreference = () => {
    const { value, setValue } = useLocalParticipantAttribute(WANTS_CAPTIONS_ATTR);

    return {
        wantsCaptions: value === 'true',
        setWantsCaptions: (next: boolean) => setValue(next ? 'true' : ''),
    };
};
