import { useEffect } from 'react';

import { useCaptionsAvailability } from './useCaptionsAvailability';
import { useCaptionsPreference } from './useCaptionsPreference';

export const useCleanupCaptions = () => {
    const { isCaptionsDisabled } = useCaptionsAvailability();
    const { wantsCaptions, setWantsCaptions } = useCaptionsPreference();

    useEffect(() => {
        if (isCaptionsDisabled && wantsCaptions) {
            void setWantsCaptions(false);
        }
    }, [isCaptionsDisabled, wantsCaptions, setWantsCaptions]);
};
