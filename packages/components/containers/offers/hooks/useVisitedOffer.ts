import { useEffect } from 'react';

import { OfferConfig } from '../interface';
import useOfferFlags from './useOfferFlags';

/**
 * Mark the offer as visited
 */
const useVisitedOffer = (offerConfig: OfferConfig) => {
    const { handleVisit, isVisited, loading } = useOfferFlags(offerConfig);

    useEffect(() => {
        if (!loading && !isVisited && offerConfig.autoPopUp === 'one-time') {
            // Only mark offer as visited for one-time offers to not show it again
            // if autoPopUp === 'each-time', it will still show the offer each time because the offer is not marked as visited
            void handleVisit();
        }
    }, [loading]);
};

export default useVisitedOffer;
