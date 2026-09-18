import { useCallback } from 'react';
import { useHistory } from 'react-router-dom';

/** Where a `GoToUpsell` CTA takes an account user. Shared by every offer
 * surface in this app so they can't drift apart.
 *
 * TODO: Launch subscription modal directly here instead of redirecting to
 * dashboard. */
export const useOfferUpgrade = () => {
    const history = useHistory();
    return useCallback(() => history.push('/dashboard'), [history]);
};
