import { getSimplePriceString } from '../../components/price/helper';

/**
 * Defines the referral reward amount to be displayed in copy.
 *
 * In the future, this amount may need to be customisable and come from the BE.
 *
 * We may also need to consider if the reward is different for referrer vs referee, and also for different plans etc.
 */
export const referralReward = getSimplePriceString('USD', 2000);
