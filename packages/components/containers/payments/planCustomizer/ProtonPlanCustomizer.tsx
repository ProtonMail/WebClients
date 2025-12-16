import type { ComponentPropsWithoutRef } from 'react';
import { useCallback, useEffect, useState } from 'react';

import { c, msgid } from 'ttag';

import Price from '@proton/components/components/price/Price';
import {
    type ADDON_NAMES,
    ADDON_PREFIXES,
    AddonFeatureLimitKeyMapping,
    type AddonGuard,
    AddonLimit,
    type Currency,
    type Cycle,
    type FreeSubscription,
    type Plan,
    type PlanIDs,
    Renew,
    SelectedPlan,
    type Subscription,
    TRIAL_MAX_DEDICATED_IPS,
    TRIAL_MAX_EXTRA_CUSTOM_DOMAINS,
    TRIAL_MAX_LUMO_SEATS,
    TRIAL_MAX_SCRIBE_SEATS,
    TRIAL_MAX_USERS,
    getAddonMultiplier,
    getAddonType,
    isDomainAddon,
    isDriveOrgSizeAddon,
    isFreeSubscription,
    isIpAddon,
    isLumoAddon,
    isMemberAddon,
    isOrgSizeAddon,
    isScribeAddon,
    setQuantity,
} from '@proton/payments';
import type { AddonBalanceKey } from '@proton/payments/core/subscription/selected-plan';
import type { PaymentTelemetryContext } from '@proton/payments/telemetry/helpers';
import { BRAND_NAME, LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import type { Audience } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import ScribeAddon from '../ScribeAddon';
import { IPsNumberCustomiser } from './IPsNumberCustomiser';
import LumoAddon from './LumoAddon';
import { NumberCustomiser, type NumberCustomiserProps } from './NumberCustomiser';
import { getForcedFeatureLimitations } from './forced-addon-limits';
import type { DecreaseBlockedReason } from './helpers';

import './ProtonPlanCustomizer.scss';

export type CustomiserMode = 'signup' | undefined;

interface AddonCustomizerProps {
    addonName: ADDON_NAMES;
    selectedPlan: SelectedPlan;
    onChangePlanIDs: (planIDs: PlanIDs) => void;
    plansMap: { [key: string]: Plan };
    loading?: boolean;
    showUsersTooltip?: boolean;
    latestSubscription?: Subscription | FreeSubscription;
    scribeAddonEnabled: boolean;
    lumoAddonEnabled: boolean;
    audience?: Audience;
    mode: CustomiserMode;
    isTrialMode: boolean;
    telemetryContext: PaymentTelemetryContext;
}

const getTrialProps = (
    isTrialMode: boolean,
    addonNameKey: ADDON_NAMES
): {} | Pick<NumberCustomiserProps, 'max' | 'increaseBlockedReasons' | 'increaseBlockedReasonText'> => {
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

const AddonCustomizer = ({
    addonName,
    selectedPlan,
    onChangePlanIDs,
    plansMap,
    loading,
    showUsersTooltip,
    latestSubscription,
    scribeAddonEnabled,
    lumoAddonEnabled,
    audience,
    mode,
    isTrialMode,
    telemetryContext,
}: AddonCustomizerProps) => {
    const [showScribeBanner, setShowScribeBanner] = useState(mode === 'signup');

    const currentPlan = SelectedPlan.createFromSubscription(latestSubscription, plansMap);

    const featureLimitKey = AddonFeatureLimitKeyMapping[addonName];
    const addon = plansMap[addonName];

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
    // The total number of scribe or lumo addons can't be higher than the total number of members
    const max =
        isScribeAddon(addonName) || isLumoAddon(addonName)
            ? selectedPlanTotalMembers
            : Math.min(forcedMax ?? Infinity, AddonLimit[addonName] * addonMultiplier);

    const trialProps = getTrialProps(isTrialMode, addonName);

    const selectedPlanIDs = selectedPlan.planIDs;
    const cycle = selectedPlan.cycle;
    const currency = selectedPlan.currency;

    const sharedNumberCustomizerProps: Pick<
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
    > = {
        addon,
        value,
        min: displayMin,
        max,
        disabled: loading,
        onChange: (newQuantity) => {
            const newValue = (newQuantity - featureValueInSelectedPlan) / addonMultiplier;
            let newPlanIDs = setQuantity(selectedPlanIDs, addon.Name, newValue);

            // #region
            // This section makes Scribe or Lumo increase and decrease together with Members.
            if (isMemberAddon(addonName)) {
                const supportedAddonNames = selectedPlan.getSupportedAddonNames();
                const scribeAddonKey = supportedAddonNames.find(isScribeAddon);
                const lumoAddonKey = supportedAddonNames.find(isLumoAddon);
                const newMembersQuantity = newQuantity;

                const currentMembersValue = value;

                const currentScribeValue = scribeAddonKey ? selectedPlanIDs[scribeAddonKey] : undefined;
                const scribeConstrain = currentMembersValue === currentScribeValue && scribeAddonEnabled;

                const currentLumoValue = lumoAddonKey ? selectedPlanIDs[lumoAddonKey] : undefined;
                const lumoConstrain = currentMembersValue === currentLumoValue && lumoAddonEnabled;

                if (scribeConstrain && scribeAddonKey) {
                    newPlanIDs = setQuantity(newPlanIDs, scribeAddonKey, newMembersQuantity);
                } else if (lumoConstrain && lumoAddonKey) {
                    newPlanIDs = setQuantity(newPlanIDs, lumoAddonKey, newMembersQuantity);
                }

                onChangePlanIDs(newPlanIDs);
                return;
            }
            // #endregion

            // #region
            // This section balances scribes and lumos when total exceeds members.
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
            // #endregion

            onChangePlanIDs(newPlanIDs);
        },
        step: addonMultiplier,
        decreaseBlockedReasons,
        increaseBlockedReasons: [],
    };

    if (isMemberAddon(addonName)) {
        if (isDriveOrgSizeAddon(addonName)) {
            return (
                <NumberCustomiser
                    key={`${addon.Name}-drive`}
                    label={c('Info').ngettext(
                        msgid`Create a secure cloud for ${value} member`,
                        `Create a secure cloud for ${value} members`,
                        value
                    )}
                    {...sharedNumberCustomizerProps}
                    {...trialProps}
                />
            );
        }

        if (isOrgSizeAddon(addonName)) {
            return (
                <NumberCustomiser
                    key={`${addon.Name}-org-size`}
                    label={c('Info').t`Organization size`}
                    {...sharedNumberCustomizerProps}
                    {...trialProps}
                />
            );
        }

        return (
            <NumberCustomiser
                key={`${addon.Name}-users`}
                label={c('Info').t`Users`}
                tooltip={
                    showUsersTooltip
                        ? c('Info').t`A user is an account associated with a single username, mailbox, and person`
                        : undefined
                }
                {...sharedNumberCustomizerProps}
                {...trialProps}
            />
        );
    }

    if (isDomainAddon(addonName)) {
        return (
            <NumberCustomiser
                key={`${addon.Name}-domain`}
                label={c('Info').t`Custom email domains`}
                tooltip={c('Info')
                    .t`Email hosting is only available for domains you already own. Domain registration is not currently available through ${BRAND_NAME}. You can host email for domains registered on any domain registrar.`}
                {...sharedNumberCustomizerProps}
                {...trialProps}
            />
        );
    }

    if (isIpAddon(addonName)) {
        return (
            <IPsNumberCustomiser
                key={`${addon.Name}-ips`}
                {...sharedNumberCustomizerProps}
                {...trialProps}
                selectedPlan={selectedPlan}
            />
        );
    }

    const addonPricePerCycle = addon.Pricing[cycle] || 0;
    const addonPriceInline = (
        <Price
            key={`${addon.Name}-1`}
            currency={currency}
            suffix={
                isScribeAddon(addonName)
                    ? c('Suffix for price').t`per user per month`
                    : c('Suffix for price').t`per month`
            }
        >
            {addonPricePerCycle / cycle}
        </Price>
    );

    if (isScribeAddon(addonName) && scribeAddonEnabled) {
        return (
            <ScribeAddon
                key={`${addon.Name}-size`}
                price={addonPriceInline}
                showScribeBanner={showScribeBanner}
                onAddScribe={() => {
                    setShowScribeBanner(false);
                    onChangePlanIDs(setQuantity(selectedPlanIDs, addon.Name, max));
                }}
                showTooltip={showUsersTooltip}
                audience={audience}
                {...sharedNumberCustomizerProps}
                {...trialProps}
            />
        );
    }

    if (isLumoAddon(addonName) && lumoAddonEnabled) {
        return (
            <LumoAddon
                key={`${addon.Name}-size`}
                price={addonPriceInline}
                onAddLumo={() => {
                    onChangePlanIDs(setQuantity(selectedPlanIDs, addon.Name, max));
                }}
                telemetryContext={telemetryContext}
                {...sharedNumberCustomizerProps}
                {...trialProps}
            />
        );
    }

    return null;
};

export interface Props extends ComponentPropsWithoutRef<'div'> {
    cycle: Cycle;
    currency: Currency;
    selectedPlanIDs: PlanIDs;
    onChangePlanIDs: (planIDs: PlanIDs) => void;
    plansMap: { [key: string]: Plan };
    loading?: boolean;
    mode?: CustomiserMode;
    showUsersTooltip?: boolean;
    latestSubscription?: Subscription | FreeSubscription;
    allowedAddonTypes?: AddonGuard[];
    audience?: Audience;
    scribeAddonEnabled?: boolean;
    lumoAddonEnabled?: boolean;
    separator?: boolean;
    isTrialMode?: boolean;
    telemetryContext: PaymentTelemetryContext;
}

function getAddonDisplayOrder(addonName: ADDON_NAMES): number {
    // the lower the index of the addon type, the higher the priority.
    const mapping = [isMemberAddon, isDomainAddon, isIpAddon, isScribeAddon, isLumoAddon] as const;
    return mapping.findIndex((guard) => guard(addonName)) ?? mapping.length;
}

export const ProtonPlanCustomizer = ({
    cycle,
    mode,
    currency,
    onChangePlanIDs,
    selectedPlanIDs,
    plansMap,
    loading,
    className,
    showUsersTooltip,
    latestSubscription,
    allowedAddonTypes,
    audience,
    scribeAddonEnabled = false,
    lumoAddonEnabled = false,
    separator = false,
    isTrialMode = false,
    telemetryContext,
    ...rest
}: Props) => {
    const normalizedSelectedPlan = SelectedPlan.createNormalized(selectedPlanIDs, plansMap, cycle, currency);

    const isAllowedAddon = useCallback(
        (addonName: ADDON_NAMES) => {
            if (!allowedAddonTypes || !allowedAddonTypes.length) {
                return true;
            }

            return allowedAddonTypes.some((guard) => guard(addonName));
        },
        [allowedAddonTypes]
    );

    const addons = normalizedSelectedPlan
        .getSupportedAddonNames()
        .filter((addonName) => {
            // Some cycles don't support some addons. For example, if user buys vpn2024 6m then 1lumo-vpn2024 doesn't
            // support 6m. So we hide the lumo addon in this case.
            const addonSupportsSelectedCycle = !!plansMap[addonName]?.Pricing[cycle];
            return addonSupportsSelectedCycle;
        })
        .sort((a, b) => getAddonDisplayOrder(a) - getAddonDisplayOrder(b));

    useEffect(
        function forceAddonsMinMaxConstraints() {
            let newPlanIDs: PlanIDs | undefined;
            for (const addonName of addons) {
                const featureLimitKey = AddonFeatureLimitKeyMapping[addonName];
                const { forcedMin, forcedMax } = getForcedFeatureLimitations({
                    plan: normalizedSelectedPlan.getPlanName(),
                    featureLimitKey,
                    subscription: latestSubscription,
                    plansMap,
                });

                let newTarget: number | undefined;
                if (forcedMin && normalizedSelectedPlan.getTotal(featureLimitKey) < forcedMin) {
                    newTarget = forcedMin;
                } else if (forcedMax && normalizedSelectedPlan.getTotal(featureLimitKey) > forcedMax) {
                    newTarget = forcedMax;
                }

                if (newTarget) {
                    newPlanIDs = setQuantity(
                        newPlanIDs ?? normalizedSelectedPlan.planIDs,
                        addonName,
                        newTarget - normalizedSelectedPlan.getTotal(featureLimitKey)
                    );
                }
            }

            if (newPlanIDs) {
                onChangePlanIDs(newPlanIDs);
            }
        },
        [selectedPlanIDs]
    );

    return (
        <div
            className={clsx([
                'plan-customiser flex flex-column gap-4',
                separator && 'plan-customiser--separator',
                className,
            ])}
            {...rest}
        >
            {addons.map((key) => {
                const addonName = key as ADDON_NAMES;

                if (!isAllowedAddon(addonName) || !plansMap[addonName]) {
                    return null;
                }

                return (
                    <AddonCustomizer
                        key={addonName}
                        scribeAddonEnabled={scribeAddonEnabled}
                        lumoAddonEnabled={lumoAddonEnabled}
                        addonName={addonName}
                        selectedPlan={normalizedSelectedPlan}
                        onChangePlanIDs={(planIDs) => {
                            const selectedPlan = SelectedPlan.createNormalized(planIDs, plansMap, cycle, currency);
                            onChangePlanIDs(selectedPlan.planIDs);
                        }}
                        plansMap={plansMap}
                        loading={loading}
                        showUsersTooltip={showUsersTooltip}
                        latestSubscription={latestSubscription}
                        audience={audience}
                        mode={mode}
                        isTrialMode={isTrialMode}
                        telemetryContext={telemetryContext}
                    />
                );
            })}
        </div>
    );
};
