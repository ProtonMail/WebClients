import React from 'react';
import { c, msgid } from 'ttag';
import { PLAN_NAMES, CYCLE, APPS, PLANS } from 'proton-shared/lib/constants';
import { unique } from 'proton-shared/lib/helpers/array';
import { getMonthlyBaseAmount, hasVisionary } from 'proton-shared/lib/helpers/subscription';
import humanSize from 'proton-shared/lib/helpers/humanSize';
import { getAppName } from 'proton-shared/lib/apps/helper';
import { Cycle } from 'proton-shared/lib/interfaces';

import { Loader, Time } from '../../components';
import { useUser, useSubscription, useOrganization, usePlans } from '../../hooks';
import { classnames } from '../../helpers';
import { SettingsParagraph, SettingsSection } from '../account';
import MozillaInfoPanel from '../account/MozillaInfoPanel';
import { formatPlans } from './subscription/helpers';
import DiscountBadge from './DiscountBadge';
import PlanPrice from './subscription/PlanPrice';
import CycleDiscountBadge from './CycleDiscountBadge';

const { MONTHLY, YEARLY, TWO_YEARS } = CYCLE;

const getBillingText = (cycle: Cycle, periodEnd: number) => {
    const formattedEndTime = <Time key="time-text">{periodEnd}</Time>;

    if (cycle === MONTHLY) {
        return c('Billing cycle').jt`Monthly billing (Renewal on ${formattedEndTime})`;
    }
    if (cycle === YEARLY) {
        return c('Billing cycle').jt`Yearly billing (Renewal on ${formattedEndTime})`;
    }
    if (cycle === TWO_YEARS) {
        return c('Billing cycle').jt`2-year billing (Renewal on ${formattedEndTime})`;
    }

    return c('Billing cycle').jt`Billing (Renewal on ${formattedEndTime})`;
};

const mailAppName = getAppName(APPS.PROTONMAIL);
const vpnAppName = getAppName(APPS.PROTONVPN_SETTINGS);

interface Props {
    permission?: boolean;
}
const BillingSection = ({ permission }: Props) => {
    const [{ hasPaidMail, hasPaidVpn }] = useUser();
    const [plans = [], loadingPlans] = usePlans();
    const [subscription, loadingSubscription] = useSubscription();
    const [organization, loadingOrganization] = useOrganization();

    if (!permission) {
        return (
            <SettingsSection>
                <SettingsParagraph>
                    {c('Info').t`There are no billing details available for your current subscription.`}
                </SettingsParagraph>
            </SettingsSection>
        );
    }

    if (loadingSubscription || loadingPlans || loadingOrganization) {
        return <Loader />;
    }

    if (subscription.isManagedByMozilla) {
        return <MozillaInfoPanel />;
    }

    const { Plans = [], Cycle, Currency, CouponCode, Amount, PeriodEnd } = subscription;
    const { mailPlan, vpnPlan, addressAddon, domainAddon, memberAddon, vpnAddon, spaceAddon } = formatPlans(Plans);
    const subTotal = unique(Plans.map(({ Name }) => Name)).reduce((acc, planName) => {
        return acc + getMonthlyBaseAmount(planName as PLANS, plans, subscription);
    }, 0);
    const discount = Amount / Cycle - subTotal;
    const spaceBonus = organization?.BonusSpace;
    const vpnBonus = organization?.BonusVPN;

    const priceRowClassName = 'flex w100 mb1';
    const priceLabelClassName = 'flex-item-fluid';
    const weakRowClassName = classnames([priceRowClassName, 'color-weak']);

    return (
        <SettingsSection>
            {hasPaidMail ? (
                <div className="border-bottom on-mobile-pb1">
                    {mailPlan ? (
                        <div className={classnames([priceRowClassName, 'text-bold'])}>
                            <div className={priceLabelClassName}>
                                {mailAppName} {PLAN_NAMES[mailPlan.Name as keyof typeof PLAN_NAMES]}
                            </div>
                            <div className="text-right">
                                <PlanPrice
                                    amount={getMonthlyBaseAmount(mailPlan.Name, plans, subscription)}
                                    currency={Currency}
                                    cycle={MONTHLY}
                                />
                            </div>
                        </div>
                    ) : null}
                    {memberAddon ? (
                        <div className={weakRowClassName}>
                            <div className={priceLabelClassName}>
                                +{' '}
                                {c('Addon unit for subscription').ngettext(
                                    msgid`${memberAddon.MaxMembers} user`,
                                    `${memberAddon.MaxMembers} users`,
                                    memberAddon.MaxMembers
                                )}
                            </div>
                            <div className="text-right">
                                <PlanPrice
                                    amount={getMonthlyBaseAmount(memberAddon.Name, plans, subscription)}
                                    currency={Currency}
                                    cycle={MONTHLY}
                                />
                            </div>
                        </div>
                    ) : null}
                    {addressAddon ? (
                        <div className={weakRowClassName}>
                            <div className={priceLabelClassName}>
                                +{' '}
                                {c('Addon unit for subscription').ngettext(
                                    msgid`${addressAddon.MaxAddresses} address`,
                                    `${addressAddon.MaxAddresses} addresses`,
                                    addressAddon.MaxAddresses
                                )}
                            </div>
                            <div className="text-right">
                                <PlanPrice
                                    amount={getMonthlyBaseAmount(addressAddon.Name, plans, subscription)}
                                    currency={Currency}
                                    cycle={MONTHLY}
                                />
                            </div>
                        </div>
                    ) : null}
                    {spaceAddon ? (
                        <div className={weakRowClassName}>
                            <div className={priceLabelClassName}>
                                + {humanSize(spaceAddon.MaxSpace)} {c('Label').t`extra storage`}
                            </div>
                            <div className="text-right">
                                <PlanPrice
                                    amount={getMonthlyBaseAmount(spaceAddon.Name, plans, subscription)}
                                    currency={Currency}
                                    cycle={MONTHLY}
                                />
                            </div>
                        </div>
                    ) : null}
                    {spaceBonus ? (
                        <div className={weakRowClassName}>
                            <div className={priceLabelClassName}>
                                + {humanSize(spaceBonus)} {c('Label').t`bonus storage`}
                            </div>
                            <div className="text-right">
                                <PlanPrice amount={0} currency={Currency} cycle={MONTHLY} />
                            </div>
                        </div>
                    ) : null}
                    {domainAddon ? (
                        <div className={weakRowClassName}>
                            <div className={priceLabelClassName}>
                                +{' '}
                                {c('Addon unit for subscription').ngettext(
                                    msgid`${domainAddon.MaxDomains} domain`,
                                    `${domainAddon.MaxDomains} domains`,
                                    domainAddon.MaxDomains
                                )}
                            </div>
                            <div className="text-right">
                                <PlanPrice
                                    amount={getMonthlyBaseAmount(domainAddon.Name, plans, subscription)}
                                    currency={Currency}
                                    cycle={MONTHLY}
                                />
                            </div>
                        </div>
                    ) : null}
                </div>
            ) : null}
            {hasPaidVpn && !hasVisionary(subscription) ? (
                <div className="border-bottom pt1 on-mobile-pb1">
                    {vpnPlan ? (
                        <div className={classnames([priceRowClassName, 'text-bold'])}>
                            <div className={priceLabelClassName}>
                                {vpnAppName} {PLAN_NAMES[vpnPlan.Name as keyof typeof PLAN_NAMES]}
                            </div>
                            <div className="text-right">
                                <PlanPrice
                                    amount={getMonthlyBaseAmount(vpnPlan.Name, plans, subscription)}
                                    currency={Currency}
                                    cycle={MONTHLY}
                                />
                            </div>
                        </div>
                    ) : null}
                    {vpnAddon ? (
                        <div className={weakRowClassName}>
                            <div className={priceLabelClassName}>
                                +{' '}
                                {c('Addon unit for subscription').ngettext(
                                    msgid`${vpnAddon.MaxVPN} connection`,
                                    `${vpnAddon.MaxVPN} connections`,
                                    vpnAddon.MaxVPN
                                )}
                            </div>
                            <div className="text-right">
                                <PlanPrice
                                    amount={getMonthlyBaseAmount(vpnAddon.Name, plans, subscription)}
                                    currency={Currency}
                                    cycle={MONTHLY}
                                />
                            </div>
                        </div>
                    ) : null}
                    {vpnBonus ? (
                        <div className={weakRowClassName}>
                            <div className={priceLabelClassName}>
                                +{' '}
                                {c('Addon unit for subscription').ngettext(
                                    msgid`${vpnBonus} connection`,
                                    `${vpnBonus} connections`,
                                    vpnBonus
                                )}
                            </div>
                            <div className="text-right">
                                <PlanPrice amount={0} currency={Currency} cycle={MONTHLY} />
                            </div>
                        </div>
                    ) : null}
                </div>
            ) : null}
            {CouponCode || [YEARLY, TWO_YEARS].includes(Cycle) ? (
                <div className="border-bottom pt1 on-mobile-pb1">
                    <div className={classnames([priceRowClassName, 'text-bold'])}>
                        <div className={priceLabelClassName}>{c('Label').t`Subtotal`}</div>
                        <div className="text-right">
                            <PlanPrice amount={subTotal} currency={Currency} cycle={MONTHLY} />
                        </div>
                    </div>
                    <div className={weakRowClassName}>
                        <div className={classnames([priceLabelClassName, 'flex flex-align-items-center'])}>
                            <div className="mr1">{c('Label').t`Discount`}</div>
                            <div className="flex flex-align-items-center">
                                {CouponCode ? (
                                    <>
                                        <code>{CouponCode}</code>&nbsp;
                                        <DiscountBadge code={CouponCode} />
                                    </>
                                ) : (
                                    <CycleDiscountBadge cycle={Cycle} />
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <PlanPrice amount={discount} currency={Currency} cycle={MONTHLY} />
                        </div>
                    </div>
                </div>
            ) : null}
            <div className="pt1">
                <div className={classnames([priceRowClassName, 'text-bold'])}>
                    <div className={priceLabelClassName}>{c('Label').t`Total`}</div>
                    <div className="text-right">
                        <PlanPrice amount={Amount} currency={Currency} cycle={Cycle} />
                    </div>
                </div>
            </div>
            <div className={classnames([weakRowClassName, 'text-right mt1'])}>
                <div className="text-right w100">{getBillingText(Cycle, PeriodEnd)}</div>
            </div>
        </SettingsSection>
    );
};

export default BillingSection;
