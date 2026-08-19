import type { Operation } from '../../interface';
import { useQ3Sale2026Offer } from '../useQ3Sale2026Offer';
import { configuration } from './configuration';
import { getIsEligible } from './eligibility';

export const useOffer = (): Operation => {
    return useQ3Sale2026Offer({ configuration, getIsEligible });
};
