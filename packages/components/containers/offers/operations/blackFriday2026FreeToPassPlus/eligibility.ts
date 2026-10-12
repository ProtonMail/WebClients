import { getCampaignScope } from '../../helpers/isCampaignApp';
import { isEligibleFreeUser } from '../blackFriday2026FreeUserEligibility';
import type { BlackFriday2026EligibilityArgs } from '../useBlackFriday2026Offer';

// Targets free users who enter the account app from Pass, offering Pass Plus 12M. The Pass app itself
// is outside the campaign, so this only ever shows on the account app's /pass pages.
export function getIsEligible(args: BlackFriday2026EligibilityArgs) {
    return isEligibleFreeUser(args) && getCampaignScope(args.protonConfig, window.location.pathname) === 'pass';
}
