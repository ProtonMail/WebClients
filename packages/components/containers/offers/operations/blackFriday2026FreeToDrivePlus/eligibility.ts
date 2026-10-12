import { getCampaignScope } from '../../helpers/isCampaignApp';
import { isEligibleFreeUser } from '../blackFriday2026FreeUserEligibility';
import type { BlackFriday2026EligibilityArgs } from '../useBlackFriday2026Offer';

// Targets free users in Drive (the app and its account dashboard), offering Drive Plus 12M.
export function getIsEligible(args: BlackFriday2026EligibilityArgs) {
    return isEligibleFreeUser(args) && getCampaignScope(args.protonConfig, window.location.pathname) === 'drive';
}
