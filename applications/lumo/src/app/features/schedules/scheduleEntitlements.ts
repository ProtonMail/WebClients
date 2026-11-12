/** Maximum saved scheduled tasks, including paused tasks, per tier. */
export const SCHEDULE_TIER_LIMITS = {
    free: 1,
    plus: 10,
    business: 50,
};

/** Use the same seat and business eligibility as skills, rather than a single subscription's plan name. */
export const getScheduleLimit = ({ hasLumoPlus, hasLumoB2B }: { hasLumoPlus: boolean; hasLumoB2B: boolean }) => {
    if (hasLumoB2B) return SCHEDULE_TIER_LIMITS.business;
    return hasLumoPlus ? SCHEDULE_TIER_LIMITS.plus : SCHEDULE_TIER_LIMITS.free;
};
