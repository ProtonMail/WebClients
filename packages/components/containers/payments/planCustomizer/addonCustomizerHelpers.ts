import type { CouponConfig } from '@proton/payments-ui/ui/coupon-config/interface';
import type { CouponConfigRendered } from '@proton/payments-ui/ui/coupon-config/useCouponConfig';
import {
    AddonFeatureLimitKeyMapping,
    getAddonConfigByName,
    getAddonConfigByType,
    getAddonConfigsByPlanName,
    getAddonDisplayOrder,
    getAddonLimit,
    getAddonSeatGroup,
    getAddonTrialLimit,
    getAllAddonConfigs,
} from '@proton/payments/core/addon/addons';
import type { AddonFlags } from '@proton/payments/core/addon/interfaces';
import { type ADDON_NAMES, ADDON_PREFIXES, FREE_SUBSCRIPTION } from '@proton/payments/core/constants';
import type { Cycle, PlanIDs } from '@proton/payments/core/interface';
import { getAddonType } from '@proton/payments/core/plan/addons';
import { getAddonMultiplier } from '@proton/payments/core/plan/feature-limits';
import type { Plan, PlansMap } from '@proton/payments/core/plan/interface';
import { setQuantity } from '@proton/payments/core/planIDs';
import { Renew } from '@proton/payments/core/subscription/constants';
import type { MaybeFreeSubscription } from '@proton/payments/core/subscription/helpers';
import { SelectedPlan } from '@proton/payments/core/subscription/selected-plan';
import { isFreeSubscription } from '@proton/payments/core/type-guards';

import { showAddonCustomizer } from '../subscription/modal-components/helpers/showAddonCustomizer';
import type { NumberCustomiserProps } from './NumberCustomiser';
import { getForcedFeatureLimitations } from './forced-addon-limits';
import type { DecreaseBlockedReason, IncreaseBlockedReason } from './helpers';

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

export type CustomiserMode = 'signup' | undefined;

export type AddonCustomizerItem = AddonCustomizerProperties & {
    addonName: ADDON_NAMES;
    preferredAddonType?: ADDON_PREFIXES;
};

/** The type to keep when normalizing this addon's seat pool — its own type, or undefined if unpooled. */
const getPreferredAddonTypeForPool = (addonName: ADDON_NAMES): ADDON_PREFIXES | undefined => {
    const addonType = getAddonType(addonName);
    return addonType && getAddonSeatGroup(addonType) ? addonType : undefined;
};

type AddonCustomizerTrialProps =
    {} | Pick<NumberCustomiserProps, 'max' | 'increaseBlockedReasons' | 'increaseBlockedReasonText'>;

const getTrialProps = (
    isTrialMode: boolean,
    addonNameKey: ADDON_NAMES,
    scribeToLumo: boolean
): AddonCustomizerTrialProps => {
    if (!isTrialMode) {
        return {};
    }

    const addonType: ADDON_PREFIXES | null = getAddonType(addonNameKey);
    const max = getAddonTrialLimit(addonType);
    const increaseBlockedReasonText = getAddonConfigByType(addonType)?.trialIncreaseBlockedReasonText?.(scribeToLumo);

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

    return getAddonConfigByName(addonName)?.isPerMemberCapped
        ? constraints.selectedPlanTotalMembers
        : Math.min(constraints.forcedMax ?? Infinity, getAddonLimit(addonName) * constraints.addonMultiplier);
};

function syncWhenEqualAddons(
    supportedAddonNames: ADDON_NAMES[],
    planIDs: PlanIDs,
    currentMemberQuantity: number,
    newMemberQuantity: number,
    addonFlags: AddonFlags
): PlanIDs {
    for (const name of supportedAddonNames) {
        const config = getAddonConfigByName(name);
        if (config?.syncWithMembersAddon !== 'when-equal') {
            continue;
        }
        const currentAddonQuantity = planIDs[name];
        if (currentMemberQuantity === currentAddonQuantity && addonFlags[config.addonType]) {
            return setQuantity(planIDs, name, newMemberQuantity);
        }
    }
    return planIDs;
}

function syncAlwaysAddons(
    supportedAddonNames: ADDON_NAMES[],
    planIDs: PlanIDs,
    newMemberQuantity: number,
    addonFlags: AddonFlags
): PlanIDs {
    let result = planIDs;
    for (const name of supportedAddonNames) {
        const config = getAddonConfigByName(name);
        if (config?.syncWithMembersAddon !== 'always') {
            continue;
        }
        const currentAddonQuantity = result[name];
        if (currentAddonQuantity && addonFlags[config.addonType]) {
            result = setQuantity(result, name, newMemberQuantity);
        }
    }
    return result;
}

function syncAddonsWithMembers(
    supportedAddonNames: ADDON_NAMES[],
    planIDs: PlanIDs,
    currentMemberQuantity: number,
    newMemberQuantity: number,
    addonFlags: AddonFlags
): PlanIDs {
    const planIDsAfterSyncWhenEquals = syncWhenEqualAddons(
        supportedAddonNames,
        planIDs,
        currentMemberQuantity,
        newMemberQuantity,
        addonFlags
    );
    return syncAlwaysAddons(supportedAddonNames, planIDsAfterSyncWhenEquals, newMemberQuantity, addonFlags);
}

export const getAddonCustomizerProperties = ({
    addonName,
    plansMap,
    loading,
    latestSubscription,
    isTrialMode,
    selectedPlan,
    onChangePlanIDs,
    addonFlags,
    scribeToLumo,
}: {
    addonName: ADDON_NAMES;
    plansMap: { [key: string]: Plan };
    loading: boolean | undefined;
    latestSubscription: MaybeFreeSubscription;
    isTrialMode: boolean;
    selectedPlan: SelectedPlan;
    onChangePlanIDs: (planIDs: PlanIDs) => void;
    addonFlags: AddonFlags;
    scribeToLumo: boolean;
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
    const trialConstraints = getTrialProps(isTrialMode, addonName, scribeToLumo);

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

            const addonConfig = getAddonConfigByName(addonName);
            if (addonConfig?.addonType === ADDON_PREFIXES.MEMBER) {
                const supportedAddonNames = selectedPlan.getSupportedAddonNames();
                onChangePlanIDs(syncAddonsWithMembers(supportedAddonNames, newPlanIDs, value, newQuantity, addonFlags));
                return;
            }

            // Scribes and lumos share the same seat pool — normalize so their total never exceeds members.
            const preferredAddonType = getPreferredAddonTypeForPool(addonName);
            if (preferredAddonType) {
                const newSelectedPlan = SelectedPlan.createNormalized(
                    newPlanIDs,
                    plansMap,
                    cycle,
                    currency,
                    preferredAddonType
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
    scribeToLumo = false,
    couponConfig,
    isSignup,
}: {
    normalizedSelectedPlan: SelectedPlan;
    plansMap: PlansMap;
    cycle: Cycle;
    loading: boolean | undefined;
    latestSubscription: MaybeFreeSubscription;
    isTrialMode: boolean;
    onChangePlanIDs: (planIDs: PlanIDs) => void;
    addonFlags: AddonFlags;
    scribeToLumo?: boolean;
    allowedAddonTypes?: ADDON_PREFIXES[];
    couponConfig?: CouponConfigRendered | CouponConfig;
    isSignup: boolean;
}): AddonCustomizerItem[] {
    const visibilityContext = {
        subscription: latestSubscription ?? FREE_SUBSCRIPTION,
        couponConfig,
        planIDs: normalizedSelectedPlan.planIDs,
        isSignup,
    };

    const resolvedAddonFlags: AddonFlags = { ...addonFlags };
    for (const { addonType, visibility } of getAllAddonConfigs()) {
        if (visibility?.rules?.length) {
            resolvedAddonFlags[addonType] ??= showAddonCustomizer(addonType, visibilityContext);
        }
    }

    const enabledAddonTypes = new Set(
        getAddonConfigsByPlanName(normalizedSelectedPlan.getPlanName(), resolvedAddonFlags).map(
            ({ addonType }) => addonType
        )
    );

    const isAllowedAddon = (addonName: ADDON_NAMES) => {
        if (!allowedAddonTypes?.length) {
            return true;
        }
        const addonType = getAddonType(addonName);
        return addonType !== null && allowedAddonTypes.includes(addonType);
    };

    return normalizedSelectedPlan
        .getSupportedAddonNames()
        .filter((addonName) => {
            const addonType = getAddonType(addonName);
            if (addonType !== null && !enabledAddonTypes.has(addonType)) {
                return false;
            }
            // Some cycles don't support some addons. For example, if user buys vpn2024 6m then 1lumo-vpn2024 doesn't
            // support 6m. So we hide the lumo addon in this case.
            const addonSupportsSelectedCycle = !!plansMap[addonName]?.Pricing[cycle];
            const canDisplayAddon = isAllowedAddon(addonName) && plansMap[addonName];

            return !!(addonSupportsSelectedCycle && canDisplayAddon);
        })
        .sort((a, b) => getAddonDisplayOrder(getAddonType(a)) - getAddonDisplayOrder(getAddonType(b)))
        .map((addonName) => ({
            addonName,
            preferredAddonType: getPreferredAddonTypeForPool(addonName),
            ...getAddonCustomizerProperties({
                addonName,
                plansMap,
                loading,
                latestSubscription,
                isTrialMode,
                selectedPlan: normalizedSelectedPlan,
                onChangePlanIDs,
                scribeToLumo,
                addonFlags: resolvedAddonFlags,
            }),
        }));
}
