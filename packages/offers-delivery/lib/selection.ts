import type { Campaign, MaybeNull } from '../interface';

/** A missing endTime never expires. No startTime check: a resolved campaign is
 * already past its startTime, so that check could only fail on a
 * backwards-skewed client clock. */
export const isExpiredCampaign = (campaign: Campaign, now: number) =>
    campaign.endTime !== null && now >= campaign.endTime;

/** Not redundant with revalidation: `cacheHelper` serves the cached value
 * synchronously, so without this an expired campaign would render and report
 * an unretractable SEEN before the refetch lands. */
export const selectActiveCampaign = (campaign: MaybeNull<Campaign>, now: number): Campaign | undefined => {
    if (!campaign || isExpiredCampaign(campaign, now)) {
        return undefined;
    }

    return campaign;
};
