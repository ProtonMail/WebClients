import type { Referral } from '@proton/shared/lib/interfaces';
import { ReferralState } from '@proton/shared/lib/interfaces';

export const getHasCompletedReferral = (referrals: Referral[]) => {
    return referrals.some(({ State }) => State === ReferralState.COMPLETED);
};
