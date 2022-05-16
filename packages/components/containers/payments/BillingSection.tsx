import { c, msgid } from 'ttag';
import { PLANS } from '@proton/shared/lib/constants';
import { unique } from '@proton/shared/lib/helpers/array';
import {
    getBaseAmount,
    getHasLegacyPlans,
    hasVisionary,
    getCycleDiscount,
} from '@proton/shared/lib/helpers/subscription';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { Plan } from '@proton/shared/lib/interfaces';
import { toMap } from '@proton/shared/lib/helpers/object';

import { Info, Loader, Time } from '../../components';
import { useOrganization, usePlans, useSubscription, useUser } from '../../hooks';
import { classnames } from '../../helpers';
import { SettingsSection } from '../account';
import MozillaInfoPanel from '../account/MozillaInfoPanel';
import { formatPlans } from './subscription/helpers';
import DiscountBadge from './DiscountBadge';
import PlanPrice from './subscription/PlanPrice';
import CycleDiscountBadge from './CycleDiscountBadge';
import Price from '../../components/price/Price';
import { getDueCycleText, getTotalBillingText } from './helper';

const getRenewalText = (periodEnd: number) => {
    const formattedEndTime = <Time key="time-text">{periodEnd}</Time>;
    return c('Billing cycle').jt`Renews automatically on ${formattedEndTime}`;
};

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

    const { Plans = [], Cycle, Currency, CouponCode, RenewAmount, PeriodEnd } = subscription;
    const { plan, mailPlan, vpnPlan, addressAddon, domainAddon, memberAddon, vpnAddon, spaceAddon } =
        formatPlans(Plans);
    const subTotal = unique(Plans.map(({ Name }) => Name)).reduce((acc, planName) => {
        return acc + getBaseAmount(planName as PLANS, plansMap, subscription, Cycle);
    }, 0);
    const discount = subTotal - RenewAmount;
    const spaceBonus = organization?.BonusSpace;
    const vpnBonus = organization?.BonusVPN;
    const maxUsers = organization?.MaxMembers || 1;

    const priceRowClassName = 'flex w100 mb1';
    const priceLabelClassName = 'flex-item-fluid';
    const weakRowClassName = classnames([priceRowClassName, 'color-weak']);

    const getCycleBadge = (plan: Plan) => {
        const cycleDiscount = getCycleDiscount(Cycle, plan.Name, plansMap);
        if (cycleDiscount) {
            return (
                <span className="ml0-5">
                    <CycleDiscountBadge cycle={Cycle} discount={cycleDiscount} />
                </span>
            );
        }
        return null;
    };

    const hasLegacyPlans = getHasLegacyPlans(subscription);

    const usersText = maxUsers
        ? c('Title').ngettext(msgid`${maxUsers} user`, `${maxUsers} users`, maxUsers)
        : undefined;

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
        </>
    );

    const priceInfo = (
        <Info
            title={c('new_plans: info').t`Price includes all applicable, non-expired coupons saved to your account.`}
        />
    );

    return (
        <SettingsSection>
            {!hasLegacyPlans && plan ? (
                <div className="border-bottom on-mobile-pb1">
                    <div className={classnames([priceRowClassName, 'text-bold'])}>{plan.Title}</div>
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
                                {mailPlan.Title}
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
                                {vpnPlan.Title}
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
                <>
                    <div className="border-bottom pt1 on-mobile-pb1">
                        <div className={classnames([priceRowClassName, 'text-bold'])}>
                            <div className={priceLabelClassName}>{getTotalBillingText(Cycle)}</div>
                            <div className="text-right">
                                <Price currency={Currency}>{subTotal}</Price>
                            </div>
                        </div>
                        <div className={weakRowClassName}>
                            <div className={classnames([priceLabelClassName, 'flex flex-align-items-center'])}>
                                {CouponCode ? (
                                    <div className="">
                                        {c('Coupon').t`Coupon applied: ${CouponCode}`}{' '}
                                        <DiscountBadge code={CouponCode}>
                                            {Math.round((Math.abs(discount) / subTotal) * 100)}%
                                        </DiscountBadge>
                                    </div>
                                ) : (
                                    <div className="">{c('Label').t`Discount`}</div>
                                )}
                            </div>
                            <div className="text-right">
                                <Price currency={Currency}>{-discount}</Price>
                            </div>
                        </div>
                    </div>
                    <div className="pt1">
                        <div className={classnames([priceRowClassName, 'text-bold'])}>
                            <div className={priceLabelClassName}>
                                <span className="mr0-5">{getDueCycleText(Cycle)}</span>
                                {priceInfo}
                            </div>
                            <div className="text-right">
                                <Price currency={Currency}>{RenewAmount}</Price>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="pt1">
                    <div className={classnames([priceRowClassName, 'text-bold'])}>
                        <div className={priceLabelClassName}>
                            <span className="mr0-5">{getTotalBillingText(Cycle)}</span>
                            {priceInfo}
                        </div>
                        <div className="text-right">
                            <Price currency={Currency}>{RenewAmount}</Price>
                        </div>
                    </div>
                </div>
            )}
            <div className={classnames([weakRowClassName, 'text-right mt1'])}>
                <div className="text-right w100">{getRenewalText(PeriodEnd)}</div>
            </div>
        </SettingsSection>
    );
};

export default BillingSection;
