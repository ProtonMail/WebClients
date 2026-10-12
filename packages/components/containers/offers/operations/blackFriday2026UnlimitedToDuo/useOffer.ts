import type { Operation } from '../../interface';
import { useBlackFriday2026Offer } from '../useBlackFriday2026Offer';
import { configuration } from './configuration';
import { getIsEligible } from './eligibility';

export const useOffer = (): Operation => {
    return useBlackFriday2026Offer({ configuration, getIsEligible });
};
