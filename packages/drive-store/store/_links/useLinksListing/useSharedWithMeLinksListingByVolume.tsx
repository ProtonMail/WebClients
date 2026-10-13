import { useRef } from 'react';

/**
 * Custom hook for managing and fetching shared with me links.
 */
export function useSharedWithMeLinksListingByVolume() {
    const shareIdsState = useRef<Set<string>>(new Set());

    const setShareIdsState = (shareIds: string[]) => {
        for (const shareId of shareIds) {
            shareIdsState.current.add(shareId);
        }
    };

    return {
        setShareIdsState,
    };
}
