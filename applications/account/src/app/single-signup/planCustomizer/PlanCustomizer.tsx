import type { ComponentPropsWithoutRef } from 'react';

import { c } from 'ttag';

import { Info } from '@proton/components';
import { getForcedFeatureLimitations } from '@proton/components/containers/payments/planCustomizer/forced-addon-limits';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';
import type { PLANS, StrictPlan } from '@proton/payments';
import {
    ADDON_NAMES,
    ADDON_PREFIXES,
    AddonFeatureLimitKeyMapping,
    type Currency,
    type Cycle,
    type Plan,
    type PlanIDs,
    TRIAL_MAX_DEDICATED_IPS,
    TRIAL_MAX_USERS,
    getAddonType,
    setQuantity,
} from '@proton/payments';
import clsx from '@proton/utils/clsx';

import ButtonNumberInput, { type ButtonNumberInputProps } from './ButtonNumberInput';
import getAddonsPricing from './getAddonsPricing';

interface AddonFieldProps extends ComponentPropsWithoutRef<'div'> {
    id: string;
    label: string;
    tooltip?: string;
}

const AddonField = ({ id, label, tooltip, className, children, ...rest }: AddonFieldProps) => {
    return (
        <div className={clsx('flex md:flex-nowrap items-center', className)} {...rest}>
            <label
                htmlFor={id}
                className="min-w-custom flex-1 plan-customiser-addon-label text-bold pr-2 w-full md:w-auto mb-1"
                style={{ '--min-w-custom': '14em' }}
            >
                {label}
                {tooltip && <Info buttonClass="ml-2" title={tooltip} />}
            </label>
            {children}
        </div>
    );
};

interface Props extends ComponentPropsWithoutRef<'div'> {
    cycle: Cycle;
    currency: Currency;
    currentPlan: StrictPlan;
    planIDs: PlanIDs;
    onChangePlanIDs: (planIDs: PlanIDs) => void;
    plansMap: { [key: string]: Plan };
    isTrialMode?: boolean;
}

const getTrialProps = (
    isTrialMode: boolean,
    addonName: PLANS | ADDON_NAMES
): {} | Pick<ButtonNumberInputProps, 'max' | 'increaseBlockedReasons' | 'increaseBlockedReasonText'> => {
    if (!isTrialMode) {
        return {};
    }

    const addonType: ADDON_PREFIXES | null = getAddonType(addonName);

    if (!addonType || (addonType !== ADDON_PREFIXES.MEMBER && addonType !== ADDON_PREFIXES.IP)) {
        return {};
    }

    const max = {
        [ADDON_PREFIXES.MEMBER]: TRIAL_MAX_USERS,
        [ADDON_PREFIXES.IP]: TRIAL_MAX_DEDICATED_IPS,
    }[addonType];

    const increaseBlockedReasonText = {
        [ADDON_PREFIXES.MEMBER]: c('b2b_trials_2025_Info')
            .t`You can have up to ${TRIAL_MAX_USERS} users during the trial period.`,
        [ADDON_PREFIXES.IP]: c('b2b_trials_2025_Info')
            .t`You can have up to ${TRIAL_MAX_DEDICATED_IPS} dedicated server during the trial period.`,
    }[addonType];

    return {
        max,
        increaseBlockedReasons: ['trial-limit'],
        increaseBlockedReasonText,
    };
};

const PlanCustomizer = ({
    cycle,
    currency,
    onChangePlanIDs,
    planIDs,
    plansMap,
    currentPlan,
    isTrialMode = false,
    className,
    ...rest
}: Props) => {
    const addonsPricing = getAddonsPricing({
        currentPlan,
        plansMap,
        planIDs,
        cycle,
    });

    if (addonsPricing.length === 0) {
        return null;
    }

    return (
        <div className={clsx(['flex flex-column gap-8', className])} {...rest}>
            {addonsPricing.map(({ value, min, max, addon, isSupported, addonMultiplier }) => {
                const id = addon.Name;
                const trialProps = getTrialProps(isTrialMode, addon.Name);
                const { forcedMin } = getForcedFeatureLimitations({
                    plan: currentPlan.Name,
                    featureLimitKey: AddonFeatureLimitKeyMapping[addon.Name as ADDON_NAMES],
                    subscription: undefined,
                    plansMap,
                });

                const buttonProps = {
                    id,
                    min: Math.max(forcedMin ?? 0, min),
                    max,
                    step: addonMultiplier,
                    value,
                    onValue: (newQuantity: number) => {
                        onChangePlanIDs(setQuantity(planIDs, addon.Name, (newQuantity - min) / addonMultiplier));
                    },
                    disabled: !isSupported,
                    ...trialProps,
                };

                // If nothing can be done with this (max <= min), don't show it
                if (
                    buttonProps.max !== undefined &&
                    buttonProps.min !== undefined &&
                    buttonProps.max <= buttonProps.min
                ) {
                    return null;
                }

                const buttonNumberInput = <ButtonNumberInput {...buttonProps} />;

                if (
                    [
                        ADDON_NAMES.MEMBER_VPN_PRO,
                        ADDON_NAMES.MEMBER_VPN_BUSINESS,
                        ADDON_NAMES.MEMBER_VPN_PASS_BUNDLE_BUSINESS,
                    ].includes(addon.Name as ADDON_NAMES)
                ) {
                    return (
                        <AddonField key={id} id={id} label={c('Info').t`Organization size`}>
                            {buttonNumberInput}
                        </AddonField>
                    );
                }

                if (getAddonType(addon.Name) === ADDON_PREFIXES.IP) {
                    return (
                        <div key={id}>
                            <AddonField
                                id={id}
                                label={c('Info').t`Dedicated servers`}
                                tooltip={c('Info')
                                    .t`Dedicated servers with dedicated IP addresses can be added to private gateways to enable fine-tuned access control.`}
                            >
                                {buttonNumberInput}
                            </AddonField>
                            {!isTrialMode && (
                                <div className="mt-2 p-3 color-weak bg-weak rounded flex flex-nowrap">
                                    <IcInfoCircle className="mr-2 mt-0.5 shrink-0" />
                                    <span>
                                        {c('Info')
                                            .t`We recommend having at least 2 servers in order to provide redundancy.`}
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                }

                return null;
            })}
        </div>
    );
};

export default PlanCustomizer;
