import { ComponentPropsWithoutRef, ReactElement, ReactNode, useState } from 'react';

import { c, msgid } from 'ttag';

import {
    ADDON_NAMES,
    AddonKey,
    AddonLimit,
    BRAND_NAME,
    GIGA,
    MEMBER_ADDON_PREFIX,
    PLANS,
    PLAN_TYPES,
    SCRIBE_ADDON_PREFIX,
} from '@proton/shared/lib/constants';
import {
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
    PlansMap,
    Subscription,
    getPlanMaxIPs,
} from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { Icon, Info, Price } from '../../components';

export type CustomiserMode = 'signup' | undefined;

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
}

const getIsValidValue = (min: number, max: number, step: number, newValue?: number) => {
    return newValue !== undefined && newValue >= min && newValue <= max && newValue % step === 0;
};

const ButtonNumberInput = ({
    value,
    onChange,
    id,
    min = 0,
    max = 999,
    step = 1,
    disabled = false,
}: {
    step?: number;
    id: string;
    min?: number;
    max?: number;
    value: number;
    disabled?: boolean;
    onChange?: (newValue: number) => void;
}) => {
    const [tmpValue, setTmpValue] = useState<number | undefined>(value);

    const isDecDisabled = disabled || !getIsValidValue(min, max, step, (tmpValue || 0) - step);
    const isIncDisabled = disabled || !getIsValidValue(min, max, step, (tmpValue || 0) + step);

    const isValidTmpValue = getIsValidValue(min, max, step, tmpValue);

    return (
        <div className="border rounded shrink-0 flex flex-nowrap">
            <button
                type="button"
                title={c('Action').t`Decrease`}
                className={clsx(['p-2 flex', isDecDisabled && 'color-disabled'])}
                disabled={isDecDisabled}
                onClick={() => {
                    if (!isValidTmpValue || tmpValue === undefined) {
                        return;
                    }
                    const newValue = tmpValue - step;
                    setTmpValue?.(newValue);
                    onChange?.(newValue);
                }}
            >
                <Icon name="minus" alt={c('Action').t`Decrease`} className="m-auto" />
            </button>
            <label htmlFor={id} className="my-2 flex">
                <input
                    autoComplete="off"
                    min={min}
                    max={max}
                    value={tmpValue}
                    id={id}
                    className="w-custom border-left border-right text-center"
                    style={{ '--w-custom': '6em' }}
                    onBlur={() => {
                        if (!isValidTmpValue) {
                            // Revert to the latest valid value upon blur
                            setTmpValue(value);
                        }
                    }}
                    onChange={({ target: { value: newValue } }) => {
                        if (newValue === '') {
                            setTmpValue?.(undefined);
                            return;
                        }
                        const newIntValue = parseInt(newValue, 10);
                        setTmpValue?.(newIntValue);
                        if (getIsValidValue(min, max, step, newIntValue)) {
                            onChange?.(newIntValue);
                        }
                    }}
                />
            </label>
            <button
                type="button"
                title={c('Action').t`Increase`}
                className={clsx(['p-2 flex', isIncDisabled && 'color-disabled'])}
                disabled={isIncDisabled}
                onClick={() => {
                    if (!isValidTmpValue || tmpValue === undefined) {
                        return;
                    }
                    const newValue = tmpValue + step;
                    setTmpValue?.(newValue);
                    onChange?.(newValue);
                }}
            >
                <Icon name="plus" alt={c('Action').t`Increase`} className="m-auto" />
            </button>
        </div>
    );
};

// translator: This string is a part of a larger string asking the user to "contact" our sales team => full sentence: Should you need more than ${maxUsers} user accounts, please <contact> our Sales team
const contactString = c('plan customizer, users').t`contact`;
const contactHref = (
    <a key={1} href="mailto:enterprise@proton.me">
        {contactString}
    </a>
);

// Since ttag doesn't support ngettext with jt, we manually replace the string with a react node...
const getAccountSizeString = (maxUsers: number, price: ReactNode) => {
    // translator: This string is followed up by the string "Should you need more than ${maxUsers} user accounts, please <contact> our Sales team"
    const first = c('plan customizer, users')
        .jt`Select the number of users to include in your plan. Each additional user costs ${price}.`;

    const contact = '_TMPL_';

    const second = c('plan customizer, users').ngettext(
        msgid`Should you need more than ${maxUsers} user account, please ${contact} our Sales team.`,
        `Should you need more than ${maxUsers} user accounts, please ${contact} our Sales team.`,
        maxUsers
    );
    return [
        first,
        ' ',
        ...second
            .split(contact)
            .map((value, index, arr) => (index !== arr.length - 1 ? [value, contactHref] : [value])),
    ];
};

type AccountTypeKey = 'org-size' | 'users' | 'gpt-seats';
type AccountSizeConfig = {
    [key in AccountTypeKey]: { label: string; tooltip?: string };
};

const AccountSizeCustomiser = ({
    addon,
    maxUsers,
    price,
    input,
    showDescription = true,
    showTooltip = true,
    mode,
}: {
    addon: Plan;
    maxUsers: number;
    price: ReactElement;
    input: ReactElement;
    showDescription?: boolean;
    showTooltip?: boolean;
    mode: AccountTypeKey;
}) => {
    const config: AccountSizeConfig = {
        'org-size': {
            label: c('Info').t`Organization size`,
        },
        users: {
            label: c('Info').t`Users`,
            tooltip: c('Info').t`A user is an account associated with a single username, mailbox, and person`,
        },
        'gpt-seats': {
            label: c('Info').t`Writing assistant add-on`,
            tooltip: c('Infog').t`AI powered assistant to help you craft better emails, quickly and effortlessly.`,
        },
    };

    return (
        <div className={clsx(showDescription ? 'mb-8' : 'mb-4')}>
            {showDescription && mode === 'users' && (
                <>
                    <h2 className="text-2xl text-bold mb-4">{c('Info').t`Account size`}</h2>
                    <div className="mb-4">{getAccountSizeString(maxUsers, price)}</div>
                </>
            )}
            <div className="flex *:min-size-auto md:flex-nowrap items-center mb-4">
                <label
                    htmlFor={addon.Name}
                    className="w-full md:w-auto min-w-custom md:min-w-custom flex-1 plan-customiser-addon-label text-bold pr-2"
                    style={{ '--min-w-custom': '8em', '--md-min-w-custom': '14em' }}
                >
                    {config[mode].label}
                    {showTooltip && config[mode]?.tooltip && <Info buttonClass="ml-2" title={config[mode].tooltip} />}
                </label>
                {input}
            </div>
        </div>
    );
};

const AdditionalOptionsCustomiser = ({
    addon,
    price,
    input,
    showDescription = true,
}: {
    addon: Plan;
    price: ReactElement;
    input: ReactElement;
    showDescription?: boolean;
}) => {
    return (
        <>
            {showDescription && (
                <>
                    <h2 className="text-2xl text-bold mb-4">{c('Info').t`Additional options`}</h2>
                    <div className="mb-4">
                        {c('Info')
                            .jt`Email hosting for 10 custom email domain names is included for free. Additional domains can be added for ${price}.`}
                    </div>
                </>
            )}
            <div className="flex *:min-size-auto md:flex-nowrap items-center mb-4">
                <label
                    htmlFor={addon.Name}
                    className="w-full md:w-auto min-w-custom md:min-w-custom flex-1 plan-customiser-addon-label text-bold pr-2"
                    style={{ '--min-w-custom': '8em', '--md-min-w-custom': '14em' }}
                >
                    {c('Info').t`Custom email domains`}
                    <Info
                        className="ml-2"
                        title={c('Info')
                            .t`Email hosting is only available for domains you already own. Domain registration is not currently available through ${BRAND_NAME}. You can host email for domains registered on any domain registrar.`}
                    />
                </label>
                {input}
            </div>
        </>
    );
};

const IPsNumberCustomiser = ({
    addon,
    maxIPs,
    price,
    input,
    showDescription = true,
}: {
    addon: Plan;
    maxIPs: number;
    price: ReactElement;
    input: ReactElement;
    showDescription?: boolean;
}) => {
    const title = c('Info').t`Dedicated servers`;

    const select = c('plan customizer, ips')
        .jt`Select the number of IPs to include in your plan. Each additional IP costs ${price}.`;

    // translator: the plural is based on maxIPs variable (number written in digits). This string is part of another one, full sentence is: Should you need more than <maxIPs> IPs, (please <contact> our Sales team).
    const description = c('plan customizer, ips').ngettext(
        msgid`Should you need more than ${maxIPs} IP, `,
        `Should you need more than ${maxIPs} IPs, `,
        maxIPs
    );

    // translator: this string is part of another one, full sentence is: (Should you need more than <maxIPs> IPs, )please <contact> our Sales team.
    const pleaseContact = c('plan customizer, ips').jt`please ${contactHref} our Sales team.`;

    return (
        <div className={clsx(showDescription ? 'mb-8' : 'mb-4')}>
            {showDescription && (
                <>
                    <h2 className="text-2xl text-bold mb-4">{title}</h2>
                    <div className="mb-4">
                        {select}
                        {description}
                        {pleaseContact}
                    </div>
                </>
            )}
            <div className="flex *:min-size-auto md:flex-nowrap items-center mb-4">
                <label
                    htmlFor={addon.Name}
                    className="w-full md:w-auto min-w-custom md:min-w-custom flex-1 plan-customiser-addon-label text-bold pr-2"
                    style={{ '--min-w-custom': '8em', '--md-min-w-custom': '14em' }}
                >
                    {title}
                    <Info buttonClass="ml-2" title={c('Info').t`Number of dedicated servers in the organization`} />
                </label>
                {input}
            </div>
        </div>
    );
};

export const getHasPlanCustomizer = ({ plansMap, planIDs }: { plansMap: PlansMap; planIDs: PlanIDs }) => {
    const [currentPlanName] =
        Object.entries(planIDs).find(([planName, planQuantity]) => {
            if (planQuantity) {
                const plan = plansMap[planName as keyof PlansMap];
                return plan?.Type === PLAN_TYPES.PLAN;
            }
            return false;
        }) || [];
    const currentPlan = plansMap?.[currentPlanName as keyof PlansMap];
    const hasPlanCustomizer = Boolean(
        currentPlan &&
            [
                PLANS.MAIL_PRO,
                PLANS.MAIL_BUSINESS,
                PLANS.DRIVE_PRO,
                PLANS.BUNDLE_PRO,
                PLANS.BUNDLE_PRO_2024,
                PLANS.ENTERPRISE,
                PLANS.VPN_PRO,
                PLANS.VPN_BUSINESS,
                PLANS.PASS_PRO,
                PLANS.PASS_BUSINESS,
            ].includes(currentPlan.Name as PLANS)
    );
    return { currentPlan, hasPlanCustomizer };
};

const ProtonPlanCustomizer = ({
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
    ...rest
}: Props) => {
    const supportedAddons = getSupportedAddons(planIDs);
    const showAddonDescriptions = mode !== 'signup' && !forceHideDescriptions;

    return (
        <div className={clsx(['plan-customiser', className])} {...rest}>
            {Object.entries(supportedAddons).map(([addonName]) => {
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
                    addonMultiplier = addon[addonMaxKey] ?? 1;
                }

                // The same workaround as above
                let min: number;
                if (addonMaxKey === 'MaxIPs') {
                    min = getPlanMaxIPs(currentPlan);
                } else {
                    min = currentPlan[addonMaxKey] ?? 0;
                }
                const max = AddonLimit[addonNameKey] * addonMultiplier;
                // Member addon comes with MaxSpace + MaxAddresses
                const value = isSupported
                    ? min + quantity * addonMultiplier
                    : Object.entries(planIDs).reduce((acc, [planName, quantity]) => {
                          // and the same workaround as above
                          let multiplier: number;
                          if (addonMaxKey === 'MaxIPs') {
                              multiplier = getPlanMaxIPs(plansMap[planName]);
                          } else {
                              multiplier = plansMap[planName][addonMaxKey];
                          }

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

                const getDisplayMin = () => {
                    if (addonMaxKey === 'MaxIPs' && hasVpnBusiness(latestSubscription)) {
                        return getVPNDedicatedIPs(latestSubscription);
                    }

                    if (addonMaxKey === 'MaxAI') {
                        return organization?.UsedAI || 0;
                    }

                    return min / divider;
                };

                const displayMin = getDisplayMin();

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
                            onChangePlanIDs(
                                setQuantity(planIDs, addon.Name, (newQuantity * divider - min) / addonMultiplier)
                            );
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
                            maxIPs={maxTotal}
                        />
                    );
                }

                if (isScribeAddon(addonNameKey)) {
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
            })}
        </div>
    );
};

export default ProtonPlanCustomizer;
