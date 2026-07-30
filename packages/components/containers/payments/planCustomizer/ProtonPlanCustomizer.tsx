import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { c } from 'ttag';

import Price from '@proton/components/components/price/Price';
import { getAddonConfigByName } from '@proton/payments/core/addon/addons';
import type { AddonFlags, CustomizerCopyContext } from '@proton/payments/core/addon/interfaces';
import { type ADDON_NAMES, ADDON_PREFIXES, FREE_SUBSCRIPTION } from '@proton/payments/core/constants';
import type { Currency, Cycle, PlanIDs } from '@proton/payments/core/interface';
import { getAddonType } from '@proton/payments/core/plan/addons';
import type { PlansMap } from '@proton/payments/core/plan/interface';
import { setQuantity } from '@proton/payments/core/planIDs';
import type { MaybeFreeSubscription } from '@proton/payments/core/subscription/helpers';
import { SelectedPlan } from '@proton/payments/core/subscription/selected-plan';
import type { PaymentTelemetryContext } from '@proton/payments/telemetry/helpers';
import type { CouponConfig } from '@proton/payments/ui/coupon-config/interface';
import type { CouponConfigRendered } from '@proton/payments/ui/coupon-config/useCouponConfig';
import type { Audience } from '@proton/shared/lib/interfaces';
import { MailFeatureFlag } from '@proton/unleash/Flags';
import { useFlag } from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import ScribeAddon from '../ScribeAddon';
import { IPsNumberCustomiser } from './IPsNumberCustomiser';
import LumoAddon from './LumoAddon';
import MeetAddon from './MeetAddon';
import { NumberCustomiser } from './NumberCustomiser';
import type { CustomiserMode, SharedAddonCustomizerProps } from './addonCustomizerHelpers';
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

type AddonRenderer = (props: AddonCustomizerProps) => ReactNode;

// Shared price element for the seat-style addons (scribe/lumo/meet).
const getAddonPriceComponent = (
    { selectedPlan: { currency, cycle }, sharedAddonCustomizerProps: { addon } }: AddonCustomizerProps,
    perUser: boolean
) => (
    <Price
        key={`${addon.Name}-1`}
        currency={currency}
        suffix={perUser ? c('Suffix for price').t`per user per month` : c('Suffix for price').t`per month`}
    >
        {(addon.Pricing[cycle] || 0) / cycle}
    </Price>
);

const getNumberCustomizerComponent: AddonRenderer = ({
    addonName,
    memberCount,
    showUsersTooltip,
    sharedAddonCustomizerProps,
}) => {
    const customizerCopy = getAddonConfigByName(addonName)?.customizerCopy;
    if (!customizerCopy) {
        return null;
    }
    const ctx: CustomizerCopyContext = { addonName, memberCount, showUsersTooltip };
    return (
        <NumberCustomiser
            key={sharedAddonCustomizerProps.addon.Name}
            label={customizerCopy.label(ctx)}
            tooltip={customizerCopy.tooltip?.(ctx)}
            {...sharedAddonCustomizerProps}
        />
    );
};

const getIpCustomizerComponent: AddonRenderer = ({ selectedPlan, sharedAddonCustomizerProps }) => (
    <IPsNumberCustomiser
        key={`${sharedAddonCustomizerProps.addon.Name}-ips`}
        {...sharedAddonCustomizerProps}
        selectedPlan={selectedPlan}
    />
);

const getScribeAddonComponent: AddonRenderer = (props) => {
    const { onChangePlanIDs, selectedPlan, showUsersTooltip, audience, mode, sharedAddonCustomizerProps } = props;
    const { addon, max } = sharedAddonCustomizerProps;
    return (
        <ScribeAddon
            key={`${addon.Name}-size`}
            price={getAddonPriceComponent(props, true)}
            onAddScribe={() => {
                onChangePlanIDs(setQuantity(selectedPlan.planIDs, addon.Name, max));
            }}
            showTooltip={showUsersTooltip}
            audience={audience}
            mode={mode}
            {...sharedAddonCustomizerProps}
        />
    );
};

const getLumoAddonComponent: AddonRenderer = (props) => {
    const { onChangePlanIDs, selectedPlan, telemetryContext, sharedAddonCustomizerProps } = props;
    const { addon, max } = sharedAddonCustomizerProps;
    return (
        <LumoAddon
            key={`${addon.Name}-size`}
            price={getAddonPriceComponent(props, false)}
            onAddLumo={() => {
                onChangePlanIDs(setQuantity(selectedPlan.planIDs, addon.Name, max));
            }}
            telemetryContext={telemetryContext}
            {...sharedAddonCustomizerProps}
        />
    );
};

const getMeetAddonComponent: AddonRenderer = (props) => {
    const { onChangePlanIDs, selectedPlan, telemetryContext, sharedAddonCustomizerProps } = props;
    const { addon, max } = sharedAddonCustomizerProps;
    return (
        <MeetAddon
            key={`${addon.Name}-size`}
            price={getAddonPriceComponent(props, false)}
            onAddMeet={() => {
                onChangePlanIDs(setQuantity(selectedPlan.planIDs, addon.Name, max));
            }}
            onRemoveMeet={() => {
                onChangePlanIDs(setQuantity(selectedPlan.planIDs, addon.Name, 0));
            }}
            locked={selectedPlan.getTotal('MaxMembers') > 0}
            telemetryContext={telemetryContext}
            {...sharedAddonCustomizerProps}
        />
    );
};

const ADDON_RENDERERS_MAPPING: Record<ADDON_PREFIXES, AddonRenderer> = {
    [ADDON_PREFIXES.MEMBER]: getNumberCustomizerComponent,
    [ADDON_PREFIXES.DOMAIN]: getNumberCustomizerComponent,
    [ADDON_PREFIXES.IP]: getIpCustomizerComponent,
    [ADDON_PREFIXES.SCRIBE]: getScribeAddonComponent,
    [ADDON_PREFIXES.LUMO]: getLumoAddonComponent,
    [ADDON_PREFIXES.MEET]: getMeetAddonComponent,
};

const AddonCustomizer = (props: AddonCustomizerProps) => {
    const addonType = getAddonType(props.addonName);
    return addonType ? ADDON_RENDERERS_MAPPING[addonType](props) : null;
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
    allowedAddonTypes?: ADDON_PREFIXES[];
    addonFlags: AddonFlags;
    couponConfig?: CouponConfigRendered | CouponConfig;
    mode?: CustomiserMode;
    showUsersTooltip?: boolean;
    audience?: Audience;
    separator?: boolean;
    telemetryContext: PaymentTelemetryContext;
    header?: ReactNode;
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
    addonFlags = {},
    couponConfig,
    className,
    showUsersTooltip,
    audience,
    separator = false,
    telemetryContext,
    header,
    ...rest
}: Props) => {
    const scribeToLumo = useFlag(MailFeatureFlag.ScribeToLumo);

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
        scribeToLumo,
        couponConfig,
        isSignup: mode === 'signup',
    });

    if (addonCustomizerItems.length === 0) {
        return null;
    }

    return (
        <>
            {header}
            <div
                className={clsx([
                    'plan-customiser flex flex-column gap-4',
                    separator && 'plan-customiser--separator',
                    className,
                ])}
                {...rest}
            >
                {addonCustomizerItems.map(
                    ({ addonName, sharedAddonCustomizerProps, memberCount, preferredAddonType }) => (
                        <AddonCustomizer
                            key={addonName}
                            addonName={addonName}
                            selectedPlan={normalizedSelectedPlan}
                            onChangePlanIDs={(planIDs) => {
                                const normalizedPlanIDs = preferredAddonType
                                    ? SelectedPlan.createNormalized(
                                          planIDs,
                                          plansMap,
                                          cycle,
                                          currency,
                                          preferredAddonType
                                      ).planIDs
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
                    )
                )}
            </div>
        </>
    );
};
