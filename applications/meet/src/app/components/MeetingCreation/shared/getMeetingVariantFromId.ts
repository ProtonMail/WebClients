import type { MeetingVariant } from '../../../types';

const MEETING_VARIANTS: MeetingVariant[] = ['purple', 'orange', 'blue', 'green', 'red'];

/**
 * Returns a deterministic variant for a given meeting ID.
 * The same ID always returns the same variant.
 */
export const getMeetingVariantFromId = (id: string | undefined): MeetingVariant => {
    if (id === undefined || id === '') {
        return MEETING_VARIANTS[0]; // default to purple
    }
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = (hash << 5) - hash + id.charCodeAt(i);
        hash = hash >>> 0;
    }
    const index = Math.abs(hash) % MEETING_VARIANTS.length;
    return MEETING_VARIANTS[index];
};
