import type { ComponentPropsWithoutRef } from 'react';
import { useCallback, useState } from 'react';

import { c, msgid } from 'ttag';

import Price from '@proton/components/components/price/Price';
import { type ADDON_NAMES, AddonKey, AddonLimit, type Currency, type PlanIDs, SelectedPlan } from '@proton/payments';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import type { AddonGuard, SupportedAddons } from '@proton/shared/lib/helpers/addons';
import {
    getSupportedAddons,
    isDomainAddon,
    isDriveOrgSizeAddon,
    isIpAddon,
    isLumoAddon,
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
import { IPsNumberCustomiser } from './IPsNumberCustomiser';
import LumoAddon from './LumoAddon';
import { NumberCustomiser, type NumberCustomiserProps } from './NumberCustomiser';
import type { DecreaseBlockedReason } from './helpers';

import './ProtonPlanCustomizer.scss';

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
    scribeAddonEnabled: boolean;
    lumoAddonEnabled: boolean;
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
    scribeAddonEnabled,
    lumoAddonEnabled,
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
    // The total number of scribe or lumo addons can't be higher than the total number of members
    const max =
        isScribeAddon(addonNameKey) || isLumoAddon(addonNameKey)
            ? selectedPlan.getTotalUsers()
            : AddonLimit[addonNameKey] * addonMultiplier;

    const sharedNumberCustomizerProps: Pick<
        NumberCustomiserProps,
        'addon' | 'value' | 'min' | 'max' | 'disabled' | 'onChange' | 'step' | 'decreaseBlockedReasons'
    > = {
        addon,
        value,
        min: displayMin,
        max,
        disabled: loading || !isSupported,
        onChange: (newQuantity) => {
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
        },
        step: addonMultiplier,
        decreaseBlockedReasons,
    };

    if (isMemberAddon(addonNameKey)) {
        if (isDriveOrgSizeAddon(addonNameKey)) {
            return (
                <NumberCustomiser
                    key={`${addon.Name}-drive`}
                    label={c('Info').ngettext(
                        msgid`Create a secure cloud for ${value} member`,
                        `Create a secure cloud for ${value} members`,
                        value
                    )}
                    {...sharedNumberCustomizerProps}
                />
            );
        }

        if (isOrgSizeAddon(addonNameKey)) {
            return (
                <NumberCustomiser
                    key={`${addon.Name}-org-size`}
                    label={c('Info').t`Organization size`}
                    {...sharedNumberCustomizerProps}
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
            />
        );
    }

    if (isDomainAddon(addonNameKey)) {
        return (
            <NumberCustomiser
                key={`${addon.Name}-domain`}
                label={c('Info').t`Custom email domains`}
                tooltip={c('Info')
                    .t`Email hosting is only available for domains you already own. Domain registration is not currently available through ${BRAND_NAME}. You can host email for domains registered on any domain registrar.`}
                {...sharedNumberCustomizerProps}
            />
        );
    }

    if (isIpAddon(addonNameKey)) {
        return <IPsNumberCustomiser key={`${addon.Name}-ips`} {...sharedNumberCustomizerProps} />;
    }

    if (isScribeAddon(addonNameKey) && scribeAddonEnabled) {
        return (
            <ScribeAddon
                key={`${addon.Name}-size`}
                price={addonPriceInline}
                showScribeBanner={showScribeBanner}
                onAddScribe={() => {
                    setShowScribeBanner(false);
                    onChangePlanIDs(setQuantity(planIDs, addon.Name, max));
                }}
                showTooltip={showUsersTooltip}
                audience={audience}
                {...sharedNumberCustomizerProps}
            />
        );
    }

    if (isLumoAddon(addonNameKey) && lumoAddonEnabled) {
        return (
            <LumoAddon
                key={`${addon.Name}-size`}
                price={addonPriceInline}
                onAddLumo={() => {
                    onChangePlanIDs(setQuantity(planIDs, addon.Name, max));
                }}
                {...sharedNumberCustomizerProps}
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
    showUsersTooltip?: boolean;
    latestSubscription?: Subscription;
    allowedAddonTypes?: AddonGuard[];
    audience?: Audience;
    scribeAddonEnabled?: boolean;
    lumoAddonEnabled?: boolean;
    separator?: boolean;
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
    showUsersTooltip,
    latestSubscription,
    allowedAddonTypes,
    audience,
    scribeAddonEnabled = false,
    lumoAddonEnabled = false,
    separator = false,
    ...rest
}: Props) => {
    const normalizePlanIds = SelectedPlan.createNormalized(planIDs, plansMap, cycle, currency).planIDs;
    const supportedAddons = getSupportedAddons(normalizePlanIds);

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
        <div
            className={clsx([
                'plan-customiser flex flex-column gap-4',
                separator && 'plan-customiser--separator',
                className,
            ])}
            {...rest}
        >
            {Object.keys(supportedAddons).map((key) => {
                const addonName = key as ADDON_NAMES;

                if (!isAllowedAddon(addonName)) {
                    return null;
                }

                return (
                    <AddonCustomizer
                        key={addonName}
                        scribeAddonEnabled={scribeAddonEnabled}
                        lumoAddonEnabled={lumoAddonEnabled}
                        addonName={addonName}
                        cycle={cycle}
                        currency={currency}
                        planIDs={normalizePlanIds}
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
                        audience={audience}
                        mode={mode}
                    />
                );
            })}
        </div>
    );
};
