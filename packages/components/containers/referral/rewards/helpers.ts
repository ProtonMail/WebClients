import type { Referral } from '@proton/shared/lib/interfaces/Referrals';
import { ReferralState } from '@proton/shared/lib/interfaces/Referrals';

export const getHasCompletedReferral = (referrals: Referral[]) => {
    return referrals.some(({ State }) => State === ReferralState.COMPLETED);
};
