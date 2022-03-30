import { c, msgid } from 'ttag';
import { APPS, CYCLE, PLAN_NAMES, PLANS } from '@proton/shared/lib/constants';
import { unique } from '@proton/shared/lib/helpers/array';
import {
    getHasCycleDiscount,
    getBaseAmount,
    getHasLegacyPlans,
    hasVisionary,
} from '@proton/shared/lib/helpers/subscription';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { Cycle, Plan } from '@proton/shared/lib/interfaces';
import { toMap } from '@proton/shared/lib/helpers/object';

import { Loader, Time } from '../../components';
import { useOrganization, usePlans, useSubscription, useUser } from '../../hooks';
import { classnames } from '../../helpers';
import { SettingsSection } from '../account';
import MozillaInfoPanel from '../account/MozillaInfoPanel';
import { formatPlans } from './subscription/helpers';
import DiscountBadge from './DiscountBadge';
import PlanPrice from './subscription/PlanPrice';
import CycleDiscountBadge from './CycleDiscountBadge';
import Price from '../../components/price/Price';

const { MONTHLY, YEARLY, TWO_YEARS } = CYCLE;

const getBillingCycleText = (cycle: Cycle) => {
    if (cycle === MONTHLY) {
        return c('Billing cycle').t`Billed monthly`;
    }
    if (cycle === YEARLY) {
        return c('Billing cycle').t`Billed annually`;
    }
    if (cycle === TWO_YEARS) {
        return c('Billing cycle').t`Billed every 2 years`;
    }
    return '';
};

const getDueCycleText = (cycle: Cycle) => {
    if (cycle === MONTHLY) {
        return c('Billing cycle').t`Due monthly`;
    }
    if (cycle === YEARLY) {
        return c('Billing cycle').t`Due annually`;
    }
    if (cycle === TWO_YEARS) {
        return c('Billing cycle').t`Due every 2 years`;
    }
    return '';
};

const getRenewalText = (periodEnd: number) => {
    const formattedEndTime = <Time key="time-text">{periodEnd}</Time>;
    return c('Billing cycle').jt`Renews automatically on ${formattedEndTime}`;
};

const mailAppName = getAppName(APPS.PROTONMAIL);
const vpnAppName = getAppName(APPS.PROTONVPN_SETTINGS);

const BillingSection = () => {
    const [{ hasPaidMail, hasPaidVpn }] = useUser();
    const [plans = [], loadingPlans] = usePlans();
    const plansMap = toMap(plans, 'Name');
    const [subscription, loadingSubscription] = useSubscription();
    const [organization, loadingOrganization] = useOrganization();

    if (loadingSubscription || loadingPlans || loadingOrganization) {
        return <Loader />;
    }

    if (subscription.isManagedByMozilla) {
        return <MozillaInfoPanel />;
    }

    const { Plans = [], Cycle, Currency, CouponCode, Amount, PeriodEnd } = subscription;
    const { plan, mailPlan, vpnPlan, addressAddon, domainAddon, memberAddon, vpnAddon, spaceAddon } =
        formatPlans(Plans);
    const subTotal = unique(Plans.map(({ Name }) => Name)).reduce((acc, planName) => {
        return acc + getBaseAmount(planName as PLANS, plansMap, subscription, Cycle);
    }, 0);
    const discount = Amount - subTotal;
    const spaceBonus = organization?.BonusSpace;
    const vpnBonus = organization?.BonusVPN;
    const maxUsers = organization?.MaxMembers || 1;

    const priceRowClassName = 'flex w100 mb1';
    const priceLabelClassName = 'flex-item-fluid';
    const weakRowClassName = classnames([priceRowClassName, 'color-weak']);

    const getCycleBadge = (plan: Plan) => {
        if (getHasCycleDiscount(Cycle, plan.Name, plansMap)) {
            return (
                <span className="ml0-5">
                    <CycleDiscountBadge cycle={Cycle} />
                </span>
            );
        }
        return null;
    };

    const hasLegacyPlans = getHasLegacyPlans(subscription);

    const usersText = maxUsers
        ? c('Title').ngettext(msgid`${maxUsers} user`, `${maxUsers} users`, maxUsers)
        : undefined;

    const planNameText = plan ? PLAN_NAMES[plan.Name as keyof typeof PLAN_NAMES] : '';

    const addons = (
        <>
            {memberAddon && hasLegacyPlans ? (
                <div className={weakRowClassName}>
                    <div className={priceLabelClassName}>
                        +{' '}
                        {c('Addon unit for subscription').ngettext(
                            msgid`${memberAddon.MaxMembers} user`,
                            `${memberAddon.MaxMembers} users`,
                            memberAddon.MaxMembers
                        )}
                        {getCycleBadge(memberAddon)}
                    </div>
                    <div className="text-right">
                        <PlanPrice
                            amount={getBaseAmount(memberAddon.Name, plansMap, subscription, Cycle)}
                            currency={Currency}
                            cycle={Cycle}
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
                        {getCycleBadge(addressAddon)}
                    </div>
                    <div className="text-right">
                        <PlanPrice
                            amount={getBaseAmount(addressAddon.Name, plansMap, subscription, Cycle)}
                            currency={Currency}
                            cycle={Cycle}
                        />
                    </div>
                </div>
            ) : null}
            {spaceAddon ? (
                <div className={weakRowClassName}>
                    <div className={priceLabelClassName}>
                        + {humanSize(spaceAddon.MaxSpace)} {c('Label').t`extra storage`}
                    </div>
                    {getCycleBadge(spaceAddon)}
                    <div className="text-right">
                        <PlanPrice
                            amount={getBaseAmount(spaceAddon.Name, plansMap, subscription, Cycle)}
                            currency={Currency}
                            cycle={Cycle}
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
                        <PlanPrice amount={0} currency={Currency} cycle={Cycle} />
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
                        {getCycleBadge(domainAddon)}
                    </div>
                    <div className="text-right">
                        <PlanPrice
                            amount={getBaseAmount(domainAddon.Name, plansMap, subscription, Cycle)}
                            currency={Currency}
                            cycle={Cycle}
                        />
                    </div>
                </div>
            ) : null}
        </>
    );

    return (
        <SettingsSection>
            {!hasLegacyPlans && plan ? (
                <div className="border-bottom on-mobile-pb1">
                    <div className={classnames([priceRowClassName, 'text-bold'])}>{planNameText}</div>
                    <div className={weakRowClassName}>
                        <div className={priceLabelClassName}>
                            {usersText}
                            {getCycleBadge(plan)}
                        </div>
                        <div className="text-right">
                            <PlanPrice
                                amount={
                                    getBaseAmount(plan.Name, plansMap, subscription, Cycle) +
                                    (memberAddon ? getBaseAmount(memberAddon.Name, plansMap, subscription, Cycle) : 0)
                                }
                                currency={Currency}
                                cycle={Cycle}
                            />
                        </div>
                    </div>
                    {addons}
                </div>
            ) : null}
            {hasLegacyPlans && hasPaidMail ? (
                <div className="border-bottom on-mobile-pb1">
                    {mailPlan ? (
                        <div className={classnames([priceRowClassName, 'text-bold'])}>
                            <div className={priceLabelClassName}>
                                {`${mailAppName} ${PLAN_NAMES[mailPlan.Name as keyof typeof PLAN_NAMES]}`}
                                {getCycleBadge(mailPlan)}
                            </div>
                            <div className="text-right">
                                <PlanPrice
                                    amount={getBaseAmount(mailPlan.Name, plansMap, subscription, Cycle)}
                                    currency={Currency}
                                    cycle={Cycle}
                                />
                            </div>
                        </div>
                    ) : null}
                    {addons}
                </div>
            ) : null}
            {hasLegacyPlans && hasPaidVpn && !hasVisionary(subscription) ? (
                <div className="border-bottom pt1 on-mobile-pb1">
                    {vpnPlan ? (
                        <div className={classnames([priceRowClassName, 'text-bold'])}>
                            <div className={priceLabelClassName}>
                                {`${vpnAppName} ${PLAN_NAMES[vpnPlan.Name as keyof typeof PLAN_NAMES]}`}
                                {getCycleBadge(vpnPlan)}
                            </div>
                            <div className="text-right">
                                <PlanPrice
                                    amount={getBaseAmount(vpnPlan.Name, plansMap, subscription, Cycle)}
                                    currency={Currency}
                                    cycle={Cycle}
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
                                {getCycleBadge(vpnAddon)}
                            </div>
                            <div className="text-right">
                                <PlanPrice
                                    amount={getBaseAmount(vpnAddon.Name, plansMap, subscription, Cycle)}
                                    currency={Currency}
                                    cycle={Cycle}
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
                                <PlanPrice amount={0} currency={Currency} cycle={Cycle} />
                            </div>
                        </div>
                    ) : null}
                </div>
            ) : null}
            {discount > 0 ? (
                <div className="border-bottom pt1 on-mobile-pb1">
                    <div className={classnames([priceRowClassName, 'text-bold'])}>
                        <div className={priceLabelClassName}>{getBillingCycleText(Cycle)}</div>
                        <div className="text-right">
                            <Price currency={Currency}>{subTotal}</Price>
                        </div>
                    </div>
                    <div className={weakRowClassName}>
                        <div className={classnames([priceLabelClassName, 'flex flex-align-items-center'])}>
                            <div className="mr1">{c('Label').t`Discount`}</div>
                            <div className="flex flex-align-items-center">
                                {CouponCode && <DiscountBadge code={CouponCode} />}
                            </div>
                        </div>
                        <div className="text-right">
                            <Price currency={Currency}>{discount}</Price>
                        </div>
                    </div>
                </div>
            ) : null}
            <div className="pt1">
                <div className={classnames([priceRowClassName, 'text-bold'])}>
                    <div className={priceLabelClassName}>{getDueCycleText(Cycle)}</div>
                    <div className="text-right">
                        <Price currency={Currency}>{Amount}</Price>
                    </div>
                </div>
            </div>
            <div className={classnames([weakRowClassName, 'text-right mt1'])}>
                <div className="text-right w100">{getRenewalText(PeriodEnd)}</div>
            </div>
        </SettingsSection>
    );
};

export default BillingSection;
