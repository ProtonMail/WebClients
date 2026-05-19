import type { ComponentPropsWithoutRef } from 'react';

import { c, msgid } from 'ttag';

import Price from '@proton/components/components/price/Price';
import {
    type ADDON_NAMES,
    type AddonGuard,
    type Currency,
    type Cycle,
    FREE_SUBSCRIPTION,
    type PlanIDs,
    type PlansMap,
    SelectedPlan,
    isDomainAddon,
    isDriveOrgSizeAddon,
    isIpAddon,
    isLumoAddon,
    isMeetAddon,
    isMemberAddon,
    isOrgSizeAddon,
    isScribeAddon,
    setQuantity,
} from '@proton/payments';
import type { MaybeFreeSubscription } from '@proton/payments/core/subscription/helpers';
import type { PaymentTelemetryContext } from '@proton/payments/telemetry/helpers';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import type { Audience } from '@proton/shared/lib/interfaces';
import { useFlag } from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import ScribeAddon from '../ScribeAddon';
import { IPsNumberCustomiser } from './IPsNumberCustomiser';
import LumoAddon from './LumoAddon';
import MeetAddon from './MeetAddon';
import { NumberCustomiser } from './NumberCustomiser';
import type { AddonFlags, CustomiserMode, SharedAddonCustomizerProps } from './addonCustomizerHelpers';
import { computeAddonCustomizerItems } from './addonCustomizerHelpers';

import './ProtonPlanCustomizer.scss';

interface AddonCustomizerProps {
    addonName: ADDON_NAMES;
    selectedPlan: SelectedPlan;
    onChangePlanIDs: (planIDs: PlanIDs) => void;
    showUsersTooltip?: boolean;
    audience?: Audience;
    mode: CustomiserMode;
    telemetryContext: PaymentTelemetryContext;
    sharedAddonCustomizerProps: SharedAddonCustomizerProps;
    memberCount: number;
}

const AddonCustomizer = ({
    addonName,
    selectedPlan,
    onChangePlanIDs,
    showUsersTooltip,
    audience,
    mode,
    telemetryContext,
    memberCount,
    sharedAddonCustomizerProps,
}: AddonCustomizerProps) => {
    const { planIDs: selectedPlanIDs, currency, cycle } = selectedPlan;
    const { addon, max } = sharedAddonCustomizerProps;

    if (isMemberAddon(addonName)) {
        if (isDriveOrgSizeAddon(addonName)) {
            return (
                <NumberCustomiser
                    key={`${addon.Name}-drive`}
                    label={c('Info').ngettext(
                        msgid`Create a secure cloud for ${memberCount} member`,
                        `Create a secure cloud for ${memberCount} members`,
                        memberCount
                    )}
                    {...sharedAddonCustomizerProps}
                />
            );
        }

        if (isOrgSizeAddon(addonName)) {
            return (
                <NumberCustomiser
                    key={`${addon.Name}-org-size`}
                    label={c('Info').t`Organization size`}
                    {...sharedAddonCustomizerProps}
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
                {...sharedAddonCustomizerProps}
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
                {...sharedAddonCustomizerProps}
            />
        );
    }

    if (isIpAddon(addonName)) {
        return (
            <IPsNumberCustomiser
                key={`${addon.Name}-ips`}
                {...sharedAddonCustomizerProps}
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

    if (isScribeAddon(addonName)) {
        return (
            <ScribeAddon
                key={`${addon.Name}-size`}
                price={addonPriceInline}
                onAddScribe={() => {
                    onChangePlanIDs(setQuantity(selectedPlanIDs, addon.Name, max));
                }}
                showTooltip={showUsersTooltip}
                audience={audience}
                mode={mode}
                {...sharedAddonCustomizerProps}
            />
        );
    }

    if (isLumoAddon(addonName)) {
        return (
            <LumoAddon
                key={`${addon.Name}-size`}
                price={addonPriceInline}
                onAddLumo={() => {
                    onChangePlanIDs(setQuantity(selectedPlanIDs, addon.Name, max));
                }}
                telemetryContext={telemetryContext}
                {...sharedAddonCustomizerProps}
            />
        );
    }

    if (isMeetAddon(addonName)) {
        const isMeetAddonLockedForPlan = selectedPlan.getTotal('MaxMembers') > 0;
        return (
            <MeetAddon
                key={`${addon.Name}-size`}
                price={addonPriceInline}
                onAddMeet={() => {
                    onChangePlanIDs(setQuantity(selectedPlanIDs, addon.Name, max));
                }}
                onRemoveMeet={() => {
                    onChangePlanIDs(setQuantity(selectedPlanIDs, addon.Name, 0));
                }}
                locked={isMeetAddonLockedForPlan}
                telemetryContext={telemetryContext}
                {...sharedAddonCustomizerProps}
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
    plansMap: PlansMap;
    loading?: boolean;
    latestSubscription?: MaybeFreeSubscription;
    isTrialMode?: boolean;
    allowedAddonTypes?: AddonGuard[];
    addonFlags: AddonFlags;
    mode?: CustomiserMode;
    showUsersTooltip?: boolean;
    audience?: Audience;
    separator?: boolean;
    telemetryContext: PaymentTelemetryContext;
}

export const ProtonPlanCustomizer = ({
    cycle,
    mode,
    currency,
    onChangePlanIDs,
    selectedPlanIDs,
    plansMap,
    loading,
    latestSubscription = FREE_SUBSCRIPTION,
    isTrialMode = false,
    allowedAddonTypes,
    addonFlags = { scribeAddonEnabled: false, lumoAddonEnabled: false, meetAddonEnabled: false },
    className,
    showUsersTooltip,
    audience,
    separator = false,
    telemetryContext,
    ...rest
}: Props) => {
    const domainVpnBiz2023Enabled = useFlag('DomainVpnBiz2023');

    const normalizedSelectedPlan = SelectedPlan.createNormalized(selectedPlanIDs, plansMap, cycle, currency);

    const addonCustomizerItems = computeAddonCustomizerItems({
        normalizedSelectedPlan,
        plansMap,
        cycle,
        loading,
        latestSubscription,
        isTrialMode,
        onChangePlanIDs,
        addonFlags,
        allowedAddonTypes,
        domainVpnBiz2023Enabled,
        mode,
    });

    return (
        <div
            className={clsx([
                'plan-customiser flex flex-column gap-4',
                separator && 'plan-customiser--separator',
                className,
            ])}
            {...rest}
        >
            {addonCustomizerItems.map(({ addonName, sharedAddonCustomizerProps, memberCount, normalizationKey }) => (
                <AddonCustomizer
                    key={addonName}
                    addonName={addonName}
                    selectedPlan={normalizedSelectedPlan}
                    onChangePlanIDs={(planIDs) => {
                        const normalizedPlanIDs = normalizationKey
                            ? SelectedPlan.createNormalized(planIDs, plansMap, cycle, currency, normalizationKey)
                                  .planIDs
                            : planIDs;
                        onChangePlanIDs(normalizedPlanIDs);
                    }}
                    showUsersTooltip={showUsersTooltip}
                    audience={audience}
                    mode={mode}
                    telemetryContext={telemetryContext}
                    sharedAddonCustomizerProps={sharedAddonCustomizerProps}
                    memberCount={memberCount}
                />
            ))}
        </div>
    );
};
