import type { ComponentPropsWithoutRef } from 'react';

import { c } from 'ttag';

import { Icon, Info } from '@proton/components';
import { ADDON_NAMES } from '@proton/shared/lib/constants';
import { setQuantity } from '@proton/shared/lib/helpers/planIDs';
import type { Currency, Cycle, Plan, PlanIDs } from '@proton/shared/lib/interfaces';
import useFlag from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import ButtonNumberInput from './ButtonNumberInput';
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
    currentPlan: Plan;
    planIDs: PlanIDs;
    onChangePlanIDs: (planIDs: PlanIDs) => void;
    plansMap: { [key: string]: Plan };
}

const PlanCustomizer = ({
    cycle,
    currency,
    onChangePlanIDs,
    planIDs,
    plansMap,
    currentPlan,
    className,
    ...rest
}: Props) => {
    const showGatewaysForBundlePlan = useFlag('ShowGatewaysForBundlePlan');
    const addonsPricing = getAddonsPricing({
        currentPlan,
        plansMap,
        planIDs,
        cycle,
        showGatewaysForBundlePlan,
    });

    if (addonsPricing.length === 0) {
        return null;
    }

    return (
        <div className={clsx(['flex flex-column gap-8', className])} {...rest}>
            {addonsPricing.map(({ value, min, max, addon, isSupported, addonMultiplier }) => {
                const id = addon.Name;

                const buttonNumberInput = (
                    <ButtonNumberInput
                        id={id}
                        min={min}
                        max={max}
                        step={addonMultiplier}
                        value={value}
                        onValue={(newQuantity) => {
                            onChangePlanIDs(setQuantity(planIDs, addon.Name, (newQuantity - min) / addonMultiplier));
                        }}
                        disabled={!isSupported}
                    />
                );

                if ([ADDON_NAMES.MEMBER_VPN_PRO, ADDON_NAMES.MEMBER_VPN_BUSINESS].includes(addon.Name as ADDON_NAMES)) {
                    return (
                        <AddonField key={id} id={id} label={c('Info').t`Organization size`}>
                            {buttonNumberInput}
                        </AddonField>
                    );
                }

                if (addon.Name === ADDON_NAMES.IP_VPN_BUSINESS) {
                    return (
                        <div>
                            <AddonField
                                key={id}
                                id={id}
                                label={c('Info').t`Dedicated servers`}
                                tooltip={c('Info')
                                    .t`Dedicated servers with dedicated IP address(es) can be added to private gateways to enable fine-tuned access control.`}
                            >
                                {buttonNumberInput}
                            </AddonField>
                            <div className="mt-2 p-3 color-weak bg-weak rounded flex flex-nowrap">
                                <Icon name="info-circle" className="mr-2 mt-0.5 shrink-0" />
                                <span>
                                    {c('Info')
                                        .t`We recommend having at least 2 servers in order to provide redundancy.`}
                                </span>
                            </div>
                        </div>
                    );
                }

                return null;
            })}
        </div>
    );
};

export default PlanCustomizer;
