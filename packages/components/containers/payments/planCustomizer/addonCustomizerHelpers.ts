import { c } from 'ttag';

import type { ADDON_NAMES } from '@proton/payments';
import {
    ADDON_PREFIXES,
    AddonFeatureLimitKeyMapping,
    type AddonGuard,
    AddonLimit,
    type Cycle,
    type Plan,
    type PlanIDs,
    type PlansMap,
    Renew,
    SelectedPlan,
    TRIAL_MAX_DEDICATED_IPS,
    TRIAL_MAX_EXTRA_CUSTOM_DOMAINS,
    TRIAL_MAX_LUMO_SEATS,
    TRIAL_MAX_MEET_SEATS,
    TRIAL_MAX_SCRIBE_SEATS,
    TRIAL_MAX_USERS,
    getAddonMultiplier,
    getAddonType,
    isDomainAddon,
    isFreeSubscription,
    isIpAddon,
    isLumoAddon,
    isMeetAddon,
    isMemberAddon,
    isScribeAddon,
    setQuantity,
} from '@proton/payments';
import type { MaybeFreeSubscription } from '@proton/payments/core/subscription/helpers';
import type { AddonBalanceKey } from '@proton/payments/core/subscription/selected-plan';
import { LUMO_SHORT_APP_NAME, MEET_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import type { NumberCustomiserProps } from './NumberCustomiser';
import { getForcedFeatureLimitations } from './forced-addon-limits';
import type { DecreaseBlockedReason, IncreaseBlockedReason } from './helpers';
import { shouldShowDomainAddon } from './shouldShowDomainAddon';

export interface AddonCustomizerProperties {
    sharedAddonCustomizerProps: SharedAddonCustomizerProps;
    memberCount: number;
}

export type SharedAddonCustomizerProps = Pick<
    NumberCustomiserProps,
    | 'addon'
    | 'value'
    | 'min'
    | 'max'
    | 'disabled'
    | 'onChange'
    | 'step'
    | 'decreaseBlockedReasons'
    | 'increaseBlockedReasons'
    | 'increaseBlockedReasonText'
>;

export interface AddonFlags {
    scribeAddonEnabled: boolean;
    lumoAddonEnabled: boolean;
    meetAddonEnabled: boolean;
}

export type CustomiserMode = 'signup' | undefined;

export type AddonCustomizerItem = AddonCustomizerProperties & {
    addonName: ADDON_NAMES;
    normalizationKey?: AddonBalanceKey;
};

type AddonCustomizerTrialProps =
    | {}
    | Pick<NumberCustomiserProps, 'max' | 'increaseBlockedReasons' | 'increaseBlockedReasonText'>;

const getTrialProps = (isTrialMode: boolean, addonNameKey: ADDON_NAMES): AddonCustomizerTrialProps => {
    if (!isTrialMode) {
        return {};
    }

    const addonType: ADDON_PREFIXES | null = getAddonType(addonNameKey);

    if (!addonType) {
        return {};
    }

    const max = {
        [ADDON_PREFIXES.MEMBER]: TRIAL_MAX_USERS,
        [ADDON_PREFIXES.SCRIBE]: TRIAL_MAX_SCRIBE_SEATS,
        [ADDON_PREFIXES.LUMO]: TRIAL_MAX_LUMO_SEATS,
        [ADDON_PREFIXES.MEET]: TRIAL_MAX_MEET_SEATS,
        [ADDON_PREFIXES.IP]: TRIAL_MAX_DEDICATED_IPS,
        [ADDON_PREFIXES.DOMAIN]: TRIAL_MAX_EXTRA_CUSTOM_DOMAINS,
    }[addonType];

    const increaseBlockedReasonText = {
        [ADDON_PREFIXES.MEMBER]: c('b2b_trials_2025_Info')
            .t`You can have up to ${TRIAL_MAX_USERS} users during the trial period.`,
        [ADDON_PREFIXES.SCRIBE]: c('b2b_trials_2025_Info')
            .t`You can have up to ${TRIAL_MAX_SCRIBE_SEATS} Scribe seats during the trial period.`,
        [ADDON_PREFIXES.LUMO]: c('b2b_trials_2025_Info')
            .t`You can have up to ${TRIAL_MAX_LUMO_SEATS} ${LUMO_SHORT_APP_NAME} seats during the trial period.`,
        [ADDON_PREFIXES.MEET]: c('meet_2025: Info')
            .t`You can have up to ${TRIAL_MAX_MEET_SEATS} ${MEET_SHORT_APP_NAME} seats during the trial period.`,
        [ADDON_PREFIXES.IP]: c('b2b_trials_2025_Info')
            .t`You can have up to ${TRIAL_MAX_DEDICATED_IPS} dedicated server during the trial period.`,
        [ADDON_PREFIXES.DOMAIN]: c('b2b_trials_2025_Info').t`You cannot add custom domains during the trial period.`,
    }[addonType];

    return {
        max,
        increaseBlockedReasons: ['trial-limit'],
        increaseBlockedReasonText,
    };
};

const getMaxAddonAmount = (
    addonName: ADDON_NAMES,
    trialConstraints: AddonCustomizerTrialProps,
    constraints: {
        selectedPlanTotalMembers: number;
        forcedMax: number | undefined;
        addonMultiplier: number;
    }
): number => {
    if ('max' in trialConstraints && trialConstraints.max !== undefined) {
        return trialConstraints.max;
    }

    return isScribeAddon(addonName) || isLumoAddon(addonName) || isMeetAddon(addonName)
        ? constraints.selectedPlanTotalMembers
        : Math.min(constraints.forcedMax ?? Infinity, AddonLimit[addonName] * constraints.addonMultiplier);
};

export const getAddonCustomizerProperties = ({
    addonName,
    plansMap,
    loading,
    latestSubscription,
    isTrialMode,
    selectedPlan,
    onChangePlanIDs,
    addonFlags,
}: {
    addonName: ADDON_NAMES;
    plansMap: { [key: string]: Plan };
    loading: boolean | undefined;
    latestSubscription: MaybeFreeSubscription;
    isTrialMode: boolean;
    selectedPlan: SelectedPlan;
    onChangePlanIDs: (planIDs: PlanIDs) => void;
    addonFlags: AddonFlags;
}): AddonCustomizerProperties => {
    const currentPlan = SelectedPlan.createFromSubscription(latestSubscription, plansMap);

    const selectedPlanIDs = selectedPlan.planIDs;
    const cycle = selectedPlan.cycle;
    const currency = selectedPlan.currency;

    const featureLimitKey = AddonFeatureLimitKeyMapping[addonName];

    const addon: Plan = plansMap[addonName];
    const addonMultiplier = getAddonMultiplier(featureLimitKey, addon);

    const decreaseBlockedReasons: DecreaseBlockedReason[] = [];

    /**
     * The forbidden modification check tracks states where it's not possible to switch from one plan to
     * another. Currently there is the only forbidden modification: decreasing addons that will be handled as
     * `SubscriptionMode.ScheduledChargedLater` while the renewal of the current subscription is disabled. This is
     * because renewal cancellation is a scheduled change by itself, and we can't stack another scheduled change on top
     * of it.
     */
    const applyForbiddenModificationLimitation = (preferredMinValue: number) => {
        // The check for the free subscription here is just a type guard. In practice, the free subscription can't be
        // cancelled.
        if (isFreeSubscription(latestSubscription)) {
            return preferredMinValue;
        }

        // If user disabled subscription renewal then it counts like a scheduled modification.
        // The system can't process /check if user wants to schedule another modification.
        // So we need to prevent user from doing that.
        const isForbiddenScheduledModification = latestSubscription?.Renew === Renew.Disabled;
        const minAddonNumberIfModificationFordidden = currentPlan.getTotal(featureLimitKey);
        if (
            isForbiddenScheduledModification &&
            minAddonNumberIfModificationFordidden > preferredMinValue &&
            // If user changes the plan, then we don't need to check for forbidden modification,
            // because in this case it will be SubscriptionMode.Proration which doesn't have this limitation.
            currentPlan.getPlanName() === selectedPlan.getPlanName()
        ) {
            decreaseBlockedReasons.push('forbidden-modification');
            return minAddonNumberIfModificationFordidden;
        }

        return preferredMinValue;
    };

    const featureValueInSelectedPlan = selectedPlan.getCountInPlan(featureLimitKey);
    const { forcedMin, forcedMax } = getForcedFeatureLimitations({
        plan: selectedPlan.getPlanName(),
        featureLimitKey,
        subscription: latestSubscription,
        plansMap,
    });

    const displayMin = applyForbiddenModificationLimitation(Math.max(forcedMin ?? 0, featureValueInSelectedPlan));

    const value = selectedPlan.getTotal(featureLimitKey);

    const selectedPlanTotalMembers = selectedPlan.getTotalUsers();
    const trialConstraints = getTrialProps(isTrialMode, addonName);

    // The total number of scribe, lumo, or meet addons can't be higher than the total number of members
    const max = getMaxAddonAmount(addonName, trialConstraints, {
        selectedPlanTotalMembers,
        forcedMax,
        addonMultiplier,
    });
    const increaseBlockedReasons: IncreaseBlockedReason[] =
        'increaseBlockedReasons' in trialConstraints ? trialConstraints.increaseBlockedReasons : [];
    const increaseBlockedReasonText: string | undefined =
        'increaseBlockedReasonText' in trialConstraints ? trialConstraints.increaseBlockedReasonText : undefined;

    // For any plan with members (Duo, Family, B2B plans, etc.), Meet seats must equal the number of users.
    // Lock the input so the user can't change the count after adding.

    const sharedNumberCustomizerProps: SharedAddonCustomizerProps = {
        addon,
        value,
        min: displayMin,
        max,
        disabled: loading,
        onChange: (newQuantity) => {
            const newValue = (newQuantity - featureValueInSelectedPlan) / addonMultiplier;
            let newPlanIDs = setQuantity(selectedPlanIDs, addon.Name, newValue);

            // Scribe, Lumo, and Meet track member count when fully in sync with it.
            if (isMemberAddon(addonName)) {
                const supportedAddonNames = selectedPlan.getSupportedAddonNames();
                const scribeAddonKey = supportedAddonNames.find(isScribeAddon);
                const lumoAddonKey = supportedAddonNames.find(isLumoAddon);
                const meetAddonKey = supportedAddonNames.find(isMeetAddon);
                const newMembersQuantity = newQuantity;

                const currentMembersValue = value;

                const currentScribeValue = scribeAddonKey ? selectedPlanIDs[scribeAddonKey] : undefined;
                const scribeConstrain = currentMembersValue === currentScribeValue && addonFlags.scribeAddonEnabled;

                const currentLumoValue = lumoAddonKey ? selectedPlanIDs[lumoAddonKey] : undefined;
                const lumoConstrain = currentMembersValue === currentLumoValue && addonFlags.lumoAddonEnabled;

                const currentMeetValue = meetAddonKey ? selectedPlanIDs[meetAddonKey] : undefined;
                // Meet always follows the member count when it's active, regardless of the current ratio.
                const meetConstrain = !!currentMeetValue && addonFlags.meetAddonEnabled;

                if (scribeConstrain && scribeAddonKey) {
                    newPlanIDs = setQuantity(newPlanIDs, scribeAddonKey, newMembersQuantity);
                } else if (lumoConstrain && lumoAddonKey) {
                    newPlanIDs = setQuantity(newPlanIDs, lumoAddonKey, newMembersQuantity);
                }

                // Meet syncs independently so it always tracks member count even when scribe/lumo also sync.
                if (meetConstrain && meetAddonKey) {
                    newPlanIDs = setQuantity(newPlanIDs, meetAddonKey, newMembersQuantity);
                }

                onChangePlanIDs(newPlanIDs);
                return;
            }

            // Scribes and lumos share the same seat pool — normalize so their total never exceeds members.
            const balanceKey: AddonBalanceKey | undefined = (() => {
                if (isLumoAddon(addonName)) {
                    return 'prefer-lumos';
                }
                if (isScribeAddon(addonName)) {
                    return 'prefer-scribes';
                }

                return undefined;
            })();
            if (balanceKey) {
                const newSelectedPlan = SelectedPlan.createNormalized(
                    newPlanIDs,
                    plansMap,
                    cycle,
                    currency,
                    balanceKey
                );
                newPlanIDs = newSelectedPlan.planIDs;
                onChangePlanIDs(newPlanIDs);
                return;
            }

            onChangePlanIDs(newPlanIDs);
        },
        step: addonMultiplier,
        decreaseBlockedReasons,
        increaseBlockedReasons,
        increaseBlockedReasonText,
    };

    return {
        sharedAddonCustomizerProps: sharedNumberCustomizerProps,
        memberCount: value,
    };
};

function getAddonDisplayOrder(addonName: ADDON_NAMES): number {
    // the lower the index of the addon type, the higher the priority.
    const mapping = [isMemberAddon, isDomainAddon, isIpAddon, isMeetAddon, isScribeAddon, isLumoAddon] as const;
    const index = mapping.findIndex((guard) => guard(addonName));
    return index === -1 ? mapping.length : index;
}

function getNormalizationKey(addonName: ADDON_NAMES): AddonBalanceKey | undefined {
    if (isLumoAddon(addonName)) {
        return 'prefer-lumos';
    }
    if (isScribeAddon(addonName)) {
        return 'prefer-scribes';
    }
    return undefined;
}

export function computeAddonCustomizerItems({
    normalizedSelectedPlan,
    plansMap,
    cycle,
    loading,
    latestSubscription,
    isTrialMode,
    onChangePlanIDs,
    addonFlags,
    allowedAddonTypes,
    domainVpnBiz2023Enabled = false,
    mode,
}: {
    normalizedSelectedPlan: SelectedPlan;
    plansMap: PlansMap;
    cycle: Cycle;
    loading: boolean | undefined;
    latestSubscription: MaybeFreeSubscription;
    isTrialMode: boolean;
    onChangePlanIDs: (planIDs: PlanIDs) => void;
    addonFlags: AddonFlags;
    allowedAddonTypes?: AddonGuard[];
    domainVpnBiz2023Enabled?: boolean;
    mode?: CustomiserMode;
}): AddonCustomizerItem[] {
    const currentPlan = SelectedPlan.createFromSubscription(latestSubscription, plansMap);

    const isAllowedAddon = (addonName: ADDON_NAMES) => {
        if (!allowedAddonTypes?.length) {
            return true;
        }
        return allowedAddonTypes.some((guard) => guard(addonName));
    };

    return normalizedSelectedPlan
        .getSupportedAddonNames()
        .filter((addonName) => {
            if (addonFlags?.scribeAddonEnabled !== true && isScribeAddon(addonName)) {
                return false;
            }
            if (addonFlags?.lumoAddonEnabled !== true && isLumoAddon(addonName)) {
                return false;
            }
            if (addonFlags?.meetAddonEnabled !== true && isMeetAddon(addonName)) {
                return false;
            }
            if (
                isDomainAddon(addonName) &&
                !shouldShowDomainAddon({ addonName, currentPlan, domainVpnBiz2023Enabled, mode })
            ) {
                return false;
            }
            // Some cycles don't support some addons. For example, if user buys vpn2024 6m then 1lumo-vpn2024 doesn't
            // support 6m. So we hide the lumo addon in this case.
            const addonSupportsSelectedCycle = !!plansMap[addonName]?.Pricing[cycle];
            const canDisplayAddon = isAllowedAddon(addonName) && plansMap[addonName];

            return !!(addonSupportsSelectedCycle && canDisplayAddon);
        })
        .sort((a, b) => getAddonDisplayOrder(a) - getAddonDisplayOrder(b))
        .map((addonName) => ({
            addonName,
            normalizationKey: getNormalizationKey(addonName),
            ...getAddonCustomizerProperties({
                addonName,
                plansMap,
                loading,
                latestSubscription,
                isTrialMode,
                selectedPlan: normalizedSelectedPlan,
                onChangePlanIDs,
                addonFlags,
            }),
        }));
}
