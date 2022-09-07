import { useEffect } from 'react';

import { OfferConfig } from '../interface';
import useOfferFlags from './useOfferFlags';

/**
 * Mark the offer as visited
 */
const useVisitedOffer = (offerConfig: OfferConfig) => {
    const { handleVisit, isVisited, loading } = useOfferFlags(offerConfig);

    useEffect(() => {
        if (!loading && !isVisited) {
            void handleVisit();
        }
    }, [loading]);
};

export default useVisitedOffer;
