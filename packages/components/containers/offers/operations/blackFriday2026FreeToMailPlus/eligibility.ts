import { getCampaignScope } from '../../helpers/isCampaignApp';
import { isEligibleFreeUser } from '../blackFriday2026FreeUserEligibility';
import type { BlackFriday2026EligibilityArgs } from '../useBlackFriday2026Offer';

// Targets free users in Inbox (Mail, Calendar and their account dashboards), offering Mail Plus 12M.
export function getIsEligible(args: BlackFriday2026EligibilityArgs) {
    return isEligibleFreeUser(args) && getCampaignScope(args.protonConfig, window.location.pathname) === 'inbox';
}
