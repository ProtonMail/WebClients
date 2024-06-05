import { ComponentPropsWithoutRef } from 'react';

import { c } from 'ttag';

import { Icon, Info } from '@proton/components';
import {
    ADDON_NAMES,
    MAX_ADDRESS_ADDON,
    MAX_DOMAIN_PRO_ADDON,
    MAX_IPS_ADDON,
    MAX_MEMBER_ADDON,
    MAX_MEMBER_VPN_B2B_ADDON,
    MAX_SPACE_ADDON,
    MAX_VPN_ADDON,
} from '@proton/shared/lib/constants';
import { setQuantity } from '@proton/shared/lib/helpers/planIDs';
import { Currency, Cycle, MaxKeys, Plan, PlanIDs } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import ButtonNumberInput from './ButtonNumberInput';
import getAddonsPricing from './getAddonsPricing';

export const AddonKey: Readonly<{
    [K in ADDON_NAMES]: MaxKeys;
}> = {
    [ADDON_NAMES.ADDRESS]: 'MaxAddresses',
    [ADDON_NAMES.MEMBER]: 'MaxMembers',
    [ADDON_NAMES.DOMAIN]: 'MaxDomains',
    [ADDON_NAMES.DOMAIN_BUNDLE_PRO]: 'MaxDomains',
    [ADDON_NAMES.DOMAIN_BUNDLE_PRO_2024]: 'MaxDomains',
    [ADDON_NAMES.DOMAIN_ENTERPRISE]: 'MaxDomains',
    [ADDON_NAMES.VPN]: 'MaxVPN',
    [ADDON_NAMES.SPACE]: 'MaxSpace',
    [ADDON_NAMES.MEMBER_MAIL_PRO]: 'MaxMembers',
    [ADDON_NAMES.MEMBER_DRIVE_PRO]: 'MaxMembers',
    [ADDON_NAMES.MEMBER_BUNDLE_PRO]: 'MaxMembers',
    [ADDON_NAMES.MEMBER_BUNDLE_PRO_2024]: 'MaxMembers',
    [ADDON_NAMES.MEMBER_ENTERPRISE]: 'MaxMembers',
    [ADDON_NAMES.MEMBER_VPN_PRO]: 'MaxMembers',
    [ADDON_NAMES.MEMBER_VPN_BUSINESS]: 'MaxMembers',
    [ADDON_NAMES.IP_VPN_BUSINESS]: 'MaxIPs',
    [ADDON_NAMES.MEMBER_PASS_PRO]: 'MaxMembers',
    [ADDON_NAMES.MEMBER_PASS_BUSINESS]: 'MaxMembers',
    [ADDON_NAMES.MEMBER_MAIL_BUSINESS]: 'MaxMembers',
};

export const addonLimit = {
    [ADDON_NAMES.SPACE]: MAX_SPACE_ADDON,
    [ADDON_NAMES.MEMBER]: MAX_MEMBER_ADDON,
    [ADDON_NAMES.DOMAIN]: MAX_DOMAIN_PRO_ADDON,
    [ADDON_NAMES.DOMAIN_BUNDLE_PRO]: MAX_DOMAIN_PRO_ADDON,
    [ADDON_NAMES.DOMAIN_BUNDLE_PRO_2024]: MAX_DOMAIN_PRO_ADDON,
    [ADDON_NAMES.DOMAIN_ENTERPRISE]: MAX_DOMAIN_PRO_ADDON,
    [ADDON_NAMES.ADDRESS]: MAX_ADDRESS_ADDON,
    [ADDON_NAMES.VPN]: MAX_VPN_ADDON,
    [ADDON_NAMES.MEMBER_MAIL_PRO]: MAX_MEMBER_ADDON,
    [ADDON_NAMES.MEMBER_DRIVE_PRO]: MAX_MEMBER_ADDON,
    [ADDON_NAMES.MEMBER_BUNDLE_PRO]: MAX_MEMBER_ADDON,
    [ADDON_NAMES.MEMBER_BUNDLE_PRO_2024]: MAX_MEMBER_ADDON,
    [ADDON_NAMES.MEMBER_ENTERPRISE]: MAX_MEMBER_ADDON,
    [ADDON_NAMES.MEMBER_VPN_PRO]: MAX_MEMBER_VPN_B2B_ADDON,
    [ADDON_NAMES.MEMBER_VPN_BUSINESS]: MAX_MEMBER_VPN_B2B_ADDON,
    [ADDON_NAMES.IP_VPN_BUSINESS]: MAX_IPS_ADDON,
    [ADDON_NAMES.MEMBER_PASS_PRO]: MAX_MEMBER_ADDON,
    [ADDON_NAMES.MEMBER_PASS_BUSINESS]: MAX_MEMBER_ADDON,
    [ADDON_NAMES.MEMBER_MAIL_BUSINESS]: MAX_MEMBER_ADDON,
} as const;

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
            {addonsPricing.map(({ value, min, max, divider, addon, isSupported, addonMultiplier }) => {
                const id = addon.Name;

                const buttonNumberInput = (
                    <ButtonNumberInput
                        id={id}
                        min={min / divider}
                        max={max / divider}
                        step={addonMultiplier}
                        value={value / divider}
                        onValue={(newQuantity) => {
                            onChangePlanIDs(
                                setQuantity(planIDs, addon.Name, (newQuantity * divider - min) / addonMultiplier)
                            );
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
