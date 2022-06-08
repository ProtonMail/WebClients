import uniqueBy from '@proton/utils/uniqueBy';
import { Referral } from '@proton/shared/lib/interfaces';

/**
 * Deduplicate referrals from API and optimistic referrals results
 * by taking API result first in consideration
 * @param referrals The referrals loaded from API call
 * @param invitedReferrals The referrals invited
 * @returns array of deduplicated referrals
 */
export const getDeduplicatedReferrals = (apiReferrals: Referral[], optimisticReferrals: Referral[]) => {
    return uniqueBy<Referral>([...optimisticReferrals, ...apiReferrals], ({ ReferralID }) => ReferralID);
};
