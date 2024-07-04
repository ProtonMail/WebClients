import { ComponentPropsWithoutRef, useCallback } from 'react';

import { c } from 'ttag';

import { SelectedPlan } from '@proton/components/payments/core/subscription/selected-plan';
import {
    ADDON_NAMES,
    AddonKey,
    AddonLimit,
    GIGA,
    MEMBER_ADDON_PREFIX,
    SCRIBE_ADDON_PREFIX,
} from '@proton/shared/lib/constants';
import {
    AddonGuard,
    getSupportedAddons,
    isDomainAddon,
    isIpAddon,
    isMemberAddon,
    isOrgSizeAddon,
    isScribeAddon,
    setQuantity,
} from '@proton/shared/lib/helpers/planIDs';
import { getVPNDedicatedIPs, hasVpnBusiness } from '@proton/shared/lib/helpers/subscription';
import {
    Currency,
    Cycle,
    Organization,
    Plan,
    PlanIDs,
    Subscription,
    getMaxValue,
    getPlanMaxIPs,
} from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { Price } from '../../../components';
import { AccountSizeCustomiser } from './AccountSizeCustomiser';
import { AdditionalOptionsCustomiser } from './AdditionalOptionsCustomiser';
import { ButtonNumberInput } from './ButtonNumberInput';
import { IPsNumberCustomiser } from './IPsNumberCustomiser';

export type CustomiserMode = 'signup' | undefined;

interface AddonCustomizerProps {
    addonName: string;
    cycle: Cycle;
    currency: Currency;
    planIDs: PlanIDs;
    onChangePlanIDs: (planIDs: PlanIDs) => void;
    plansMap: { [key: string]: Plan };
    currentPlan: Plan;
    organization?: Organization;
    loading?: boolean;
    mode?: CustomiserMode;
    showUsersTooltip?: boolean;
    latestSubscription?: Subscription;
    supportedAddons: { [key: string]: boolean };
    showAddonDescriptions: boolean;
    scribeAddonEnabled?: boolean;
}

const AddonCustomizer = ({
    addonName,
    cycle,
    currency,
    planIDs,
    onChangePlanIDs,
    plansMap,
    currentPlan,
    organization,
    loading,
    mode,
    showUsersTooltip,
    latestSubscription,
    supportedAddons,
    showAddonDescriptions,
    scribeAddonEnabled,
}: AddonCustomizerProps) => {
    const addon = plansMap[addonName];

    if (!addon) {
        return null;
    }

    const addonNameKey = addon.Name as ADDON_NAMES;
    const quantity = planIDs[addon.Name] ?? 0;

    const isSupported = !!supportedAddons[addonNameKey];
    const addonMaxKey = AddonKey[addonNameKey];
    /**
     * Workaround specifically for MaxIPs property. There is an upcoming mirgation in payments API v5
     * That will sctructure all these Max* properties in a different way.
     * For now, we need to handle MaxIPs separately.
     * See {@link MaxKeys} and {@link Plan}. Note that all properties from MaxKeys must be present in Plan
     * with the exception of MaxIPs.
     */
    let addonMultiplier: number;
    if (addonMaxKey === 'MaxIPs') {
        addonMultiplier = getPlanMaxIPs(addon);
        if (addonMultiplier === 0) {
            addonMultiplier = 1;
        }
    } else {
        addonMultiplier = getMaxValue(addon, addonMaxKey) ?? 1;
    }

    const min: number = getMaxValue(currentPlan, addonMaxKey);
    const max = AddonLimit[addonNameKey] * addonMultiplier;

    // Member addon comes with MaxSpace + MaxAddresses
    const value = isSupported
        ? min + quantity * addonMultiplier
        : Object.entries(planIDs).reduce((acc, [planName, quantity]) => {
              const multiplier: number = getMaxValue(plansMap[planName], addonMaxKey);
              return acc + quantity * multiplier;
          }, 0);

    const divider = addonNameKey === ADDON_NAMES.SPACE ? GIGA : 1;
    let maxTotal = max / divider;

    const addonPricePerCycle = addon.Pricing[cycle] || 0;
    const addonPriceInline = (
        <Price key={`${addon.Name}-1`} currency={currency} suffix={c('Suffix for price').t`per month`}>
            {addonPricePerCycle / cycle}
        </Price>
    );

    const displayMin = (() => {
        // Minimum is 0 for the AI assistant addon .
        // If seats are already assigned, they will be removed at the end of the
        // billing cycle.
        // Crucial for multi-account plans that do not have multi users enabled.
        // This is currently the only way for them to unassign their own seat
        if (isScribeAddon(addonNameKey)) {
            return 0;
        }

        if (addonMaxKey === 'MaxIPs' || hasVpnBusiness(latestSubscription)) {
            return getVPNDedicatedIPs(latestSubscription);
        }

        const usedAiAddons = organization?.UsedAI ?? 0;
        if (addonMaxKey === 'MaxAI') {
            return usedAiAddons;
        }

        const result = min / divider;
        if (addonMaxKey === 'MaxMembers') {
            // If user has used AI addons, then we can't set less members than AI addons.
            // Because the number of users can't be lower than the number of AI addons.
            // Note: this is valid only if we don't have customizable plans with included AI addons.
            // For example, if we introduce at some point a B2B plan that includes AI seats without the addon
            // then this section should be refactored.
            return Math.max(result, usedAiAddons);
        }

        return result;
    })();

    if (isScribeAddon(addonNameKey)) {
        // We get the amount of add-ons starting with the members, this is used for the GPT add-ons
        // We start at one since the members starts at 1 not 0 (for the admin)
        const memberTotal = Object.entries(planIDs).reduce((previous, value) => {
            if (value[0].startsWith(MEMBER_ADDON_PREFIX)) {
                return previous + value[1];
            }
            return previous;
        }, 1);

        const gptAddonNumber = Object.entries(planIDs).reduce((previous, value) => {
            if (value[0].startsWith(SCRIBE_ADDON_PREFIX)) {
                return previous + value[1];
            }
            return previous;
        }, 0);

        maxTotal = gptAddonNumber > memberTotal ? gptAddonNumber : memberTotal;
    }

    const input = (
        <ButtonNumberInput
            key={`${addon.Name}-input`}
            id={addon.Name}
            value={value / divider}
            min={displayMin}
            max={maxTotal}
            disabled={loading || !isSupported}
            onChange={(newQuantity) => {
                onChangePlanIDs(setQuantity(planIDs, addon.Name, (newQuantity * divider - min) / addonMultiplier));
            }}
            step={addonMultiplier}
        />
    );

    if (isMemberAddon(addonNameKey)) {
        return (
            <AccountSizeCustomiser
                mode={isOrgSizeAddon(addonNameKey) ? 'org-size' : 'users'}
                key={`${addon.Name}-size`}
                addon={addon}
                price={addonPriceInline}
                input={input}
                maxUsers={maxTotal}
                showDescription={showAddonDescriptions}
                showTooltip={showUsersTooltip}
            />
        );
    }

    if (isDomainAddon(addonNameKey) && mode !== 'signup') {
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
                maxIPs={maxTotal}
            />
        );
    }

    if (isScribeAddon(addonNameKey) && scribeAddonEnabled) {
        return (
            <AccountSizeCustomiser
                key={`${addon.Name}-size`}
                addon={addon}
                price={addonPriceInline}
                input={input}
                maxUsers={maxTotal}
                showDescription={showAddonDescriptions}
                showTooltip={showUsersTooltip}
                mode="gpt-seats"
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
    organization?: Organization;
    loading?: boolean;
    mode?: CustomiserMode;
    forceHideDescriptions?: boolean;
    showUsersTooltip?: boolean;
    latestSubscription?: Subscription;
    allowedAddonTypes?: AddonGuard[];
    scribeEnabled: boolean;
}

export const ProtonPlanCustomizer = ({
    cycle,
    mode,
    currency,
    onChangePlanIDs,
    planIDs,
    plansMap,
    currentPlan,
    organization,
    loading,
    className,
    forceHideDescriptions,
    showUsersTooltip,
    latestSubscription,
    allowedAddonTypes,
    scribeEnabled,
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
                        organization={organization}
                        loading={loading}
                        mode={mode}
                        showUsersTooltip={showUsersTooltip}
                        latestSubscription={latestSubscription}
                        supportedAddons={supportedAddons}
                        showAddonDescriptions={showAddonDescriptions}
                    />
                );
            })}
        </div>
    );
};
