import { useRoomInfo } from '@livekit/components-react';

import { CAPTIONS_DISABLED_METADATA_KEY } from '../../constants';

const parseCaptionsDisabled = (metadata: string | undefined): boolean => {
    if (!metadata) {
        return false;
    }
    try {
        const parsed: unknown = JSON.parse(metadata);
        if (typeof parsed !== 'object' || parsed === null) {
            return false;
        }
        return (parsed as Record<string, unknown>)[CAPTIONS_DISABLED_METADATA_KEY] === true;
    } catch {
        return false;
    }
};

export const useCaptionsAvailability = (): { isCaptionsDisabled: boolean } => {
    const { metadata } = useRoomInfo();

    return { isCaptionsDisabled: parseCaptionsDisabled(metadata) };
};
