import { CYCLE, DEFAULT_CURRENCY, DEFAULT_CYCLE, PLAN_SERVICES, PLAN_TYPES, PLANS } from '../constants';
import { Plan } from '../interfaces';

export const FREE_MAIL_PLAN = {
    ID: 'free',
    Name: 'free_mail' as PLANS,
    Title: 'Free',
    Type: PLAN_TYPES.PLAN,
    Currency: DEFAULT_CURRENCY,
    Cycle: DEFAULT_CYCLE,
    Amount: 0,
    MaxDomains: 0,
    MaxAddresses: 0,
    MaxSpace: 0,
    MaxMembers: 0,
    MaxVPN: 1,
    MaxTier: 0,
    Services: PLAN_SERVICES.MAIL + PLAN_SERVICES.VPN,
    Quantity: 1,
    Features: 0,
    Pricing: {
        [CYCLE.MONTHLY]: 0,
        [CYCLE.YEARLY]: 0,
        [CYCLE.TWO_YEARS]: 0,
    },
} as Plan;

export const FREE_VPN_PLAN = {
    ...FREE_MAIL_PLAN,
    Name: 'free_vpn' as PLANS,
} as Plan;
