import type { ComponentPropsWithoutRef } from 'react';
import { useCallback, useState } from 'react';

import { c } from 'ttag';

import Price from '@proton/components/components/price/Price';
import { type ADDON_NAMES, AddonKey, AddonLimit, type Currency, type PlanIDs, SelectedPlan } from '@proton/payments';
import type { AddonGuard, SupportedAddons } from '@proton/shared/lib/helpers/addons';
import {
    getSupportedAddons,
    isDomainAddon,
    isDriveOrgSizeAddon,
    isIpAddon,
    isMemberAddon,
    isOrgSizeAddon,
    isScribeAddon,
} from '@proton/shared/lib/helpers/addons';
import { setQuantity } from '@proton/shared/lib/helpers/planIDs';
import {
    getAddonMultiplier,
    getMaxValue,
    getVPNDedicatedIPs,
    hasBundlePro,
    hasBundlePro2024,
    hasVpnBusiness,
} from '@proton/shared/lib/helpers/subscription';
import type { Audience, Cycle, Plan, Subscription } from '@proton/shared/lib/interfaces';
import { Renew } from '@proton/shared/lib/interfaces';
import { useFlag } from '@proton/unleash';
import clsx from '@proton/utils/clsx';

import ScribeAddon from '../ScribeAddon';
import { AccountSizeCustomiser } from './AccountSizeCustomiser';
import { AdditionalOptionsCustomiser } from './AdditionalOptionsCustomiser';
import { ButtonNumberInput } from './ButtonNumberInput';
import { IPsNumberCustomiser } from './IPsNumberCustomiser';
import type { DecreaseBlockedReason } from './helpers';

export type CustomiserMode = 'signup' | undefined;

interface AddonCustomizerProps {
    addonName: string;
    cycle: Cycle;
    currency: Currency;
    planIDs: PlanIDs;
    onChangePlanIDs: (planIDs: PlanIDs) => void;
    plansMap: { [key: string]: Plan };
    currentPlan: Plan;
    loading?: boolean;
    showUsersTooltip?: boolean;
    latestSubscription?: Subscription;
    supportedAddons: SupportedAddons;
    showAddonDescriptions: boolean;
    scribeAddonEnabled?: boolean;
    audience?: Audience;
    mode: CustomiserMode;
}

const AddonCustomizer = ({
    addonName,
    cycle,
    currency,
    planIDs,
    onChangePlanIDs,
    plansMap,
    currentPlan,
    loading,
    showUsersTooltip,
    latestSubscription,
    supportedAddons,
    showAddonDescriptions,
    scribeAddonEnabled,
    audience,
    mode,
}: AddonCustomizerProps) => {
    const ipAddonDowngrade = useFlag('IpAddonDowngrade');

    const addon = plansMap[addonName];
    const [showScribeBanner, setShowScribeBanner] = useState(mode === 'signup');

    if (!addon) {
        return null;
    }

    const addonNameKey = addon.Name as ADDON_NAMES;
    const quantity = planIDs[addon.Name] ?? 0;

    const isSupported = !!supportedAddons[addonNameKey];
    const addonMaxKey = AddonKey[addonNameKey];

    const addonMultiplier = getAddonMultiplier(addonMaxKey, addon);

    const scribeAddonKey = (Object.keys(supportedAddons) as ADDON_NAMES[]).find(isScribeAddon);

    const min: number = getMaxValue(currentPlan, addonMaxKey);

    // Member addon comes with MaxSpace + MaxAddresses
    const value = isSupported
        ? min + quantity * addonMultiplier
        : Object.entries(planIDs).reduce((acc, [planName, quantity]) => {
              const multiplier: number = getMaxValue(plansMap[planName], addonMaxKey);
              return acc + quantity * multiplier;
          }, 0);

    const addonPricePerCycle = addon.Pricing[cycle] || 0;
    const addonPriceInline = (
        <Price
            key={`${addon.Name}-1`}
            currency={currency}
            suffix={
                isScribeAddon(addonNameKey)
                    ? c('Suffix for price').t`per user per month`
                    : c('Suffix for price').t`per month`
            }
        >
            {addonPricePerCycle / cycle}
        </Price>
    );

    const subscriptionPlan = SelectedPlan.createFromSubscription(latestSubscription, plansMap);

    const decreaseBlockedReasons: DecreaseBlockedReason[] = [];

    const applyForbiddenModificationLimitation = (value: number) => {
        // If user disabled subscription renewal then it counts like a scheduled modification.
        // At the same time, the addon downgrading will also create scheduled modification
        // The system can't process /check if user wants to schedule another modification.
        // So we need to prevent user from doing that.
        const isForbiddenScheduledModification = latestSubscription?.Renew === Renew.Disabled;
        const minAddonNumberIfModificationFordidden = subscriptionPlan.getTotalByMaxKey(addonMaxKey);
        if (isForbiddenScheduledModification && minAddonNumberIfModificationFordidden > value) {
            decreaseBlockedReasons.push('forbidden-modification');
            return minAddonNumberIfModificationFordidden;
        }

        return value;
    };

    const displayMin = (() => {
        // Minimum is 0 for the AI assistant addon.
        // If seats are already assigned, they will be removed at the end of the
        // billing cycle.
        // Crucial for multi-account plans that do not have multi users enabled.
        // This is currently the only way for them to unassign their own seat
        if (isScribeAddon(addonNameKey)) {
            return applyForbiddenModificationLimitation(0);
        }

        // Existing users of VPN Business can't downgrade the number of IP addons, it must be done by contacting
        // customer support.
        if (
            // This feature flag enables self-service downgrading of IP addons
            !ipAddonDowngrade &&
            isIpAddon(addonNameKey) &&
            (hasVpnBusiness(latestSubscription) ||
                hasBundlePro(latestSubscription) ||
                hasBundlePro2024(latestSubscription))
        ) {
            const minNumberOfServers = getVPNDedicatedIPs(latestSubscription);
            return applyForbiddenModificationLimitation(minNumberOfServers);
        }

        return applyForbiddenModificationLimitation(min);
    })();

    const selectedPlan = new SelectedPlan(planIDs, plansMap, cycle, currency);
    // The total number of GPT addons can't be higher than the total number of members
    const max = isScribeAddon(addonNameKey)
        ? selectedPlan.getTotalMembers()
        : AddonLimit[addonNameKey] * addonMultiplier;

    const input = (
        <ButtonNumberInput
            key={`${addon.Name}-input`}
            id={addon.Name}
            value={value}
            min={displayMin}
            max={max}
            disabled={loading || !isSupported}
            onChange={(newQuantity) => {
                const newValue = (newQuantity - min) / addonMultiplier;
                let newPlanIDs = setQuantity(planIDs, addon.Name, newValue);
                if (isMemberAddon(addonNameKey) && scribeAddonKey) {
                    const membersValue = value;
                    const scribeValue = planIDs[scribeAddonKey];
                    const scribeConstrain = membersValue === scribeValue;
                    if (scribeConstrain) {
                        newPlanIDs = setQuantity(newPlanIDs, scribeAddonKey, newQuantity);
                    }
                }
                onChangePlanIDs(newPlanIDs);
            }}
            step={addonMultiplier}
            decreaseBlockedReasons={decreaseBlockedReasons}
        />
    );

    if (isMemberAddon(addonNameKey)) {
        return (
            <AccountSizeCustomiser
                mode={isDriveOrgSizeAddon(addonNameKey) ? 'drive' : isOrgSizeAddon(addonNameKey) ? 'org-size' : 'users'}
                key={`${addon.Name}-size`}
                addon={addon}
                value={value}
                price={addonPriceInline}
                input={input}
                maxUsers={max}
                showDescription={showAddonDescriptions}
                showTooltip={showUsersTooltip}
            />
        );
    }

    if (isDomainAddon(addonNameKey)) {
        return (
            <AdditionalOptionsCustomiser
                key={`${addon.Name}-options`}
                addon={addon}
                price={addonPriceInline}
                input={input}
                showDescription={showAddonDescriptions}
            />
        );
    }

    if (isIpAddon(addonNameKey)) {
        return (
            <IPsNumberCustomiser
                key={`${addon.Name}-ips`}
                addon={addon}
                price={addonPriceInline}
                input={input}
                showDescription={showAddonDescriptions}
                maxIPs={max}
            />
        );
    }

    if (isScribeAddon(addonNameKey) && scribeAddonEnabled) {
        return (
            <ScribeAddon
                key={`${addon.Name}-size`}
                addon={addon}
                price={addonPriceInline}
                input={input}
                value={value}
                maxUsers={max}
                showScribeBanner={showScribeBanner}
                onShowScribeBanner={() => {
                    setShowScribeBanner(false);
                    onChangePlanIDs(setQuantity(planIDs, addon.Name, max));
                }}
                showDescription={showAddonDescriptions}
                showTooltip={showUsersTooltip}
                audience={audience}
            />
        );
    }

    return null;
};

interface Props extends ComponentPropsWithoutRef<'div'> {
    cycle: Cycle;
    currency: Currency;
    currentPlan: Plan;
    planIDs: PlanIDs;
    onChangePlanIDs: (planIDs: PlanIDs) => void;
    plansMap: { [key: string]: Plan };
    loading?: boolean;
    mode?: CustomiserMode;
    forceHideDescriptions?: boolean;
    showUsersTooltip?: boolean;
    latestSubscription?: Subscription;
    allowedAddonTypes?: AddonGuard[];
    audience?: Audience;
    scribeEnabled?: boolean;
}

export const ProtonPlanCustomizer = ({
    cycle,
    mode,
    currency,
    onChangePlanIDs,
    planIDs,
    plansMap,
    currentPlan,
    loading,
    className,
    forceHideDescriptions,
    showUsersTooltip,
    latestSubscription,
    allowedAddonTypes,
    audience,
    scribeEnabled = true,
    ...rest
}: Props) => {
    const supportedAddons = getSupportedAddons(planIDs);
    const showAddonDescriptions = mode !== 'signup' && !forceHideDescriptions;

    const isAllowedAddon = useCallback(
        (addonName: ADDON_NAMES) => {
            if (!allowedAddonTypes || !allowedAddonTypes.length) {
                return true;
            }

            return allowedAddonTypes.some((guard) => guard(addonName));
        },
        [allowedAddonTypes]
    );

    return (
        <div className={clsx(['plan-customiser', className])} {...rest}>
            {Object.keys(supportedAddons).map((key) => {
                const addonName = key as ADDON_NAMES;

                if (!isAllowedAddon(addonName)) {
                    return null;
                }

                return (
                    <AddonCustomizer
                        key={addonName}
                        scribeAddonEnabled={scribeEnabled}
                        addonName={addonName}
                        cycle={cycle}
                        currency={currency}
                        planIDs={planIDs}
                        onChangePlanIDs={(planIDs) => {
                            const selectedPlan = SelectedPlan.createNormalized(planIDs, plansMap, cycle, currency);
                            onChangePlanIDs(selectedPlan.planIDs);
                        }}
                        plansMap={plansMap}
                        currentPlan={currentPlan}
                        loading={loading}
                        showUsersTooltip={showUsersTooltip}
                        latestSubscription={latestSubscription}
                        supportedAddons={supportedAddons}
                        showAddonDescriptions={showAddonDescriptions}
                        audience={audience}
                        mode={mode}
                    />
                );
            })}
        </div>
    );
};
