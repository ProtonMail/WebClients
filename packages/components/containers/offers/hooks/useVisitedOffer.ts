import { useEffect } from 'react';

import type { OfferConfig } from '../interface';
import useOfferFlags from './useOfferFlags';

/**
 * Mark the offer as visited
 */
const useVisitedOffer = (offerConfig: OfferConfig) => {
    const { handleVisit, handleVisitAndConsumeReplay, isVisited, isReplayConsumed, loading } =
        useOfferFlags(offerConfig);

    useEffect(() => {
        if (loading || offerConfig.autoPopUp !== 'one-time') {
            // Only mark offer as visited for one-time offers to not show it again
            // if autoPopUp === 'each-time', it will still show the offer each time because the offer is not marked as visited
            return;
        }

        // Prevents two auto pop ups occurring by setting both the Visited and ReplayConsumed at the same time.
        // Then replayAutoPopUp can use an Unleash feature flag so we can trigger another pop up whenever we like.
        if (offerConfig.replayAutoPopUp && !isReplayConsumed) {
            void handleVisitAndConsumeReplay();
            return;
        }

        if (!isVisited) {
            void handleVisit();
        }
    }, [loading]);
};

export default useVisitedOffer;
