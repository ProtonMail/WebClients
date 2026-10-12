import { isCampaignApp } from '../../helpers/isCampaignApp';
import { isEligibleFreeUser } from '../blackFriday2026FreeUserEligibility';
import type { BlackFriday2026EligibilityArgs } from '../useBlackFriday2026Offer';

// Targets free users, offering Unlimited 12M. Being free is not product-specific, so this runs in any
// campaign app; the tracking ref records which one the user converted from.
export function getIsEligible(args: BlackFriday2026EligibilityArgs) {
    return isEligibleFreeUser(args) && isCampaignApp(args.protonConfig, window.location.pathname);
}
