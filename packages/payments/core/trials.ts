import { TrialType } from './subscription/constants';
import { getIsB2BAudienceFromSubscription } from './subscription/helpers/plan-audience';
import { isTrial } from './subscription/helpers/trial';
import type { MaybeFreeSubscription, Subscription } from './subscription/interface';
import { isPaidSubscription } from './type-guards';

export type SubscriptionExistsTrialInfo = {
    hasSubscription: true;
    /**
     * has at least one B2C trial
     */
    hasAtLeastOneB2CTrial: boolean;
    /**
     * has at least one B2B trial
     */
    hasAtLeastOneB2BTrial: boolean;
    /**
     * has at least one trial
     */
    hasAtLeastOneTrial: boolean;
    /**
     * has all trials
     */
    allSubscriptionsAreTrials: boolean;
    /**
     * has all full subscriptions
     */
    allSubscriptionsAreFull: boolean;
    /**
     * has at least one referral trial
     */
    hasReferralTrial: boolean;
    /**
     * has at least one family trial
     */
    hasFamilyTrial: boolean;
};

type SubscriptionDoesNotExistTrialInfo = {
    hasSubscription: false;
};

type TrialInfo = SubscriptionDoesNotExistTrialInfo | SubscriptionExistsTrialInfo;

type TrialInfoForSingleSubscription = ReturnType<typeof getTrialInfoForSingleSubscription>;

export function getTrialInfoForSingleSubscription(subscription: MaybeFreeSubscription) {
    // This particular check can be answered with the per-plan entitlement catalog endpoint once it's introduced.
    // Keeping the static B2B check for now.
    // multi-subs: migrate once entitlement catalog is introduced
    const isB2BSubscription = getIsB2BAudienceFromSubscription(subscription);

    const isTrialSubscription = isTrial(subscription);

    const isB2CTrial = isTrialSubscription && !isB2BSubscription;
    const isB2BTrial = isTrialSubscription && isB2BSubscription;

    const paidSubscription = isPaidSubscription(subscription);

    const isReferralTrial =
        paidSubscription && isTrialSubscription && subscription.TrialType === TrialType.ReferralProgram;
    const isFamilyTrial = paidSubscription && isTrialSubscription && subscription.TrialType === TrialType.FamilyPlan;

    return {
        isB2CTrial,
        isB2BTrial,
        isTrial: isTrialSubscription,
        isReferralTrial,
        isFamilyTrial,
    };
}

export function getTrialInfo(subscriptions: Subscription[]): TrialInfo {
    if (subscriptions.length === 0) {
        return {
            hasSubscription: false,
        } satisfies SubscriptionDoesNotExistTrialInfo;
    }

    const trialInfos = subscriptions.map(getTrialInfoForSingleSubscription);

    const hasAtLeastOneB2CTrial = trialInfos.some((result) => result.isB2CTrial);
    const hasAtLeastOneB2BTrial = trialInfos.some((result) => result.isB2BTrial);
    const hasAtLeastOneTrial = trialInfos.some((result) => result.isTrial);

    const hasReferralTrial = trialInfos.some((result) => result.isReferralTrial);
    const hasFamilyTrial = trialInfos.some((result) => result.isFamilyTrial);

    const allSubscriptionsAreTrials = trialInfos.every((result) => result.isB2CTrial || result.isB2BTrial);
    const allSubscriptionsAreFull = !hasAtLeastOneTrial;

    return {
        hasSubscription: true,
        hasAtLeastOneTrial,
        hasAtLeastOneB2CTrial,
        hasAtLeastOneB2BTrial,
        allSubscriptionsAreTrials,
        allSubscriptionsAreFull,
        hasReferralTrial,
        hasFamilyTrial,
    };
}

type TrialFilter = Pick<
    TrialInfoForSingleSubscription,
    'isB2CTrial' | 'isB2BTrial' | 'isReferralTrial' | 'isFamilyTrial'
>;

export function getTrialSubscription(
    subscriptions: Subscription[],
    filter?: Partial<TrialFilter>
): Subscription | null {
    type GranularFilter = keyof TrialFilter;
    type FilterEntry = GranularFilter | 'isTrial';

    const definedFilter = filter ?? {};
    const granularFilters = Object.keys(definedFilter)
        .map((key) => key as GranularFilter) // applying type cast by the definition of the TrialFilter type
        .filter((key) => definedFilter[key]);

    // we extract all the keys that have true + we add isTrial as fallback
    const filterEntries: FilterEntry[] = [...granularFilters, 'isTrial' as const];

    return (
        subscriptions.find((subscription) => {
            const trialInfo = getTrialInfoForSingleSubscription(subscription);

            // the .every() function will fallback to the 'isTrial' if all the other keys are not existant or false.
            return filterEntries.every((key) => trialInfo[key]);
        }) ?? null
    );
}
