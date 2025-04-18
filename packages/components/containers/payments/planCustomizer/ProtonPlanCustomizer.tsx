import type { ComponentPropsWithoutRef } from 'react';
import { useCallback, useEffect, useState } from 'react';

import { c, msgid } from 'ttag';

import Price from '@proton/components/components/price/Price';
import {
    ADDON_NAMES,
    AddonKey,
    AddonLimit,
    type Currency,
    type Cycle,
    type FreeSubscription,
    type Plan,
    type PlanIDs,
    Renew,
    SelectedPlan,
    type Subscription,
    isFreeSubscription,
} from '@proton/payments';
import { MAX_MEMBER_PASS_PRO_ADDON, MIN_MEMBER_PASS_B2B_ADDON } from '@proton/payments/core/constants';
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
    isPassOrgSizeAddon,
    isScribeAddon,
} from '@proton/shared/lib/helpers/addons';
import { setQuantity } from '@proton/shared/lib/helpers/planIDs';
import {
    getAddonMultiplier,
    getHasPassB2BPlan,
    getMaxValue,
    getVPNDedicatedIPs,
    hasBundlePro,
    hasBundlePro2024,
    hasVpnBusiness,
} from '@proton/shared/lib/helpers/subscription';
import type { Audience } from '@proton/shared/lib/interfaces';
import { useFlag } from '@proton/unleash';
import clsx from '@proton/utils/clsx';

import ScribeAddon from '../ScribeAddon';
import { IPsNumberCustomiser } from './IPsNumberCustomiser';
import LumoAddon from './LumoAddon';
import { NumberCustomiser, type NumberCustomiserProps } from './NumberCustomiser';
import type { DecreaseBlockedReason } from './helpers';

import './ProtonPlanCustomizer.scss';

export type CustomiserMode = 'signup' | undefined;

/**
 * PASS PRO organization min size: 3, max size: 30.
 * PASS BUSINESS organization min size: 3, max size: none.
 * Only hardcoded in the UI, not BE.
 */
const isWithinPassOrgSizeLimit = ({ size, isPassPro }: { size: number; isPassPro: boolean }) => {
    const min = MIN_MEMBER_PASS_B2B_ADDON;
    const max = isPassPro ? MAX_MEMBER_PASS_PRO_ADDON : null;
    return size >= min && (!max || max >= size);
};

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
    latestSubscription?: Subscription | FreeSubscription;
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
    const passOrgSizeLimitFlag = useFlag('PassOrgSizeLimit');

    const addon = plansMap[addonName];
    const [showScribeBanner, setShowScribeBanner] = useState(mode === 'signup');

    const selectedPlan = new SelectedPlan(planIDs, plansMap, cycle, currency);
    const planTotalMembers = selectedPlan.getTotalUsers();

    const subscriptionPlan = SelectedPlan.createFromSubscription(latestSubscription, plansMap);
    const latestPlanTotalMembers = subscriptionPlan.getTotalUsers();

    const addonNameKey = addon.Name as ADDON_NAMES;
    const quantity = planIDs[addon.Name] ?? 0;

    const addonMaxKey = AddonKey[addonNameKey];

    const addonMultiplier = getAddonMultiplier(addonMaxKey, addon);

    const min: number = getMaxValue(currentPlan, addonMaxKey);

    const value = min + quantity * addonMultiplier;

    const isPassProOrgSizeAddon = addonNameKey === ADDON_NAMES.MEMBER_PASS_PRO;

    /**
     * Only enforce Pass organization size limit for:
     * - users who currently don't have a Pass B2B plan
     * - users with an existing Pass B2B plan within organization size limit.
     * Don't enforce for existing Pass B2B users who aren't within limit.
     */
    const enforcePassOrgSizeLimit =
        passOrgSizeLimitFlag &&
        isPassOrgSizeAddon(addonNameKey) &&
        (!getHasPassB2BPlan(latestSubscription) ||
            isWithinPassOrgSizeLimit({
                size: latestPlanTotalMembers,
                isPassPro: isPassProOrgSizeAddon,
            }));

    const decreaseBlockedReasons: DecreaseBlockedReason[] = [];

    const applyForbiddenModificationLimitation = (value: number) => {
        // The check for the free subscription here is just a type guard. In practice,
        // the free subscription can't be cancelled.
        if (isFreeSubscription(latestSubscription)) {
            return value;
        }

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

        if (enforcePassOrgSizeLimit) {
            return applyForbiddenModificationLimitation(MIN_MEMBER_PASS_B2B_ADDON);
        }

        return applyForbiddenModificationLimitation(min);
    })();

    // The total number of scribe or lumo addons can't be higher than the total number of members
    const max =
        isScribeAddon(addonNameKey) || isLumoAddon(addonNameKey)
            ? planTotalMembers
            : AddonLimit[addonNameKey] * addonMultiplier;

    const sharedNumberCustomizerProps: Pick<
        NumberCustomiserProps,
        'addon' | 'value' | 'min' | 'max' | 'disabled' | 'onChange' | 'step' | 'decreaseBlockedReasons'
    > = {
        addon,
        value,
        min: displayMin,
        max,
        disabled: loading,
        onChange: (newQuantity) => {
            const newValue = (newQuantity - min) / addonMultiplier;
            let newPlanIDs = setQuantity(planIDs, addon.Name, newValue);
            const scribeAddonKey = (Object.keys(supportedAddons) as ADDON_NAMES[]).find(isScribeAddon);
            const lumoAddonKey = (Object.keys(supportedAddons) as ADDON_NAMES[]).find(isLumoAddon);

            if (isMemberAddon(addonNameKey) && scribeAddonKey) {
                const membersValue = value;
                const scribeValue = planIDs[scribeAddonKey];
                const scribeConstrain = membersValue === scribeValue;
                if (scribeConstrain) {
                    newPlanIDs = setQuantity(newPlanIDs, scribeAddonKey, newQuantity);
                }
            }

            if (isLumoAddon(addonNameKey) && scribeAddonKey) {
                const newSelectedPlan = SelectedPlan.createNormalized(
                    newPlanIDs,
                    plansMap,
                    cycle,
                    currency,
                    'prefer-lumos'
                );
                newPlanIDs = newSelectedPlan.planIDs;
            }

            if (isScribeAddon(addonNameKey) && lumoAddonKey) {
                const newSelectedPlan = SelectedPlan.createNormalized(
                    newPlanIDs,
                    plansMap,
                    cycle,
                    currency,
                    'prefer-scribes'
                );
                newPlanIDs = newSelectedPlan.planIDs;
            }

            onChangePlanIDs(newPlanIDs);
        },
        step: addonMultiplier,
        decreaseBlockedReasons,
    };

    useEffect(() => {
        // Hardcode client-side the Pass B2B organization size limit:
        // - min 3 for any Pass B2B plan
        // - max 30 only for Pass Pro plan
        if (enforcePassOrgSizeLimit) {
            if (planTotalMembers < MIN_MEMBER_PASS_B2B_ADDON) {
                const newPlanIDs = setQuantity(planIDs, addon.Name, MIN_MEMBER_PASS_B2B_ADDON - min);
                onChangePlanIDs(newPlanIDs);
            } else if (isPassProOrgSizeAddon && planTotalMembers > MAX_MEMBER_PASS_PRO_ADDON) {
                const newPlanIDs = setQuantity(planIDs, addon.Name, MAX_MEMBER_PASS_PRO_ADDON - min);
                onChangePlanIDs(newPlanIDs);
            }
        }
    }, [planTotalMembers]);

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
                    {...(enforcePassOrgSizeLimit && isPassProOrgSizeAddon ? { max: MAX_MEMBER_PASS_PRO_ADDON } : {})}
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

export interface Props extends ComponentPropsWithoutRef<'div'> {
    cycle: Cycle;
    currency: Currency;
    currentPlan: Plan;
    planIDs: PlanIDs;
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

                if (!isAllowedAddon(addonName) || !plansMap[addonName]) {
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
