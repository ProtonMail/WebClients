import React from 'react';
import PropTypes from 'prop-types';
import { c, msgid } from 'ttag';
import { PLAN_NAMES, CYCLE } from 'proton-shared/lib/constants';
import { unique } from 'proton-shared/lib/helpers/array';
import { getMonthlyBaseAmount, hasVisionary, getPlanIDs } from 'proton-shared/lib/helpers/subscription';
import humanSize from 'proton-shared/lib/helpers/humanSize';

import { Alert, Loader, LinkButton, Time, Info } from '../../components';
import { useUser, useSubscription, useOrganization, useModals, usePlans } from '../../hooks';
import MozillaInfoPanel from '../account/MozillaInfoPanel';
import { formatPlans } from './subscription/helpers';
import DiscountBadge from './DiscountBadge';
import GiftCodeModal from './GiftCodeModal';
import CreditsModal from './CreditsModal';
import PlanPrice from './subscription/PlanPrice';
import SubscriptionModal from './subscription/SubscriptionModal';
import CycleDiscountBadge from './CycleDiscountBadge';
import { SUBSCRIPTION_STEPS } from './subscription/constants';

const { MONTHLY, YEARLY, TWO_YEARS } = CYCLE;

const getCyclesI18N = () => ({
    [MONTHLY]: c('Billing cycle').t`Monthly`,
    [YEARLY]: c('Billing cycle').t`Yearly`,
    [TWO_YEARS]: c('Billing cycle').t`2-year`,
});

const BillingSection = ({ permission }) => {
    const i18n = getCyclesI18N();
    const { createModal } = useModals();
    const [{ hasPaidMail, hasPaidVpn, Credit, isFree }] = useUser();
    const [plans, loadingPlans] = usePlans();
    const [subscription, loadingSubscription] = useSubscription();
    const [organization, loadingOrganization] = useOrganization();
    const handleOpenGiftCodeModal = () => createModal(<GiftCodeModal />);
    const handleOpenCreditsModal = () => createModal(<CreditsModal />);
    const handleOpenSubscriptionModal = () =>
        createModal(
            <SubscriptionModal
                planIDs={getPlanIDs(subscription)}
                coupon={subscription.CouponCode}
                currency={subscription.Currency}
                cycle={YEARLY}
                step={isFree ? SUBSCRIPTION_STEPS.PLAN_SELECTION : SUBSCRIPTION_STEPS.CUSTOMIZATION}
            />
        );

    if (!permission) {
        return (
            <>
                <Alert>{c('Info').t`There are no billing details available for your current subscription.`}</Alert>
                <div className="shadow-norm bg-weak mb1 pt1 pl1 pr1">
                    <div className="flex-autogrid on-mobile-flex-column w100 mb1">
                        <div className="flex-autogrid-item">{c('Label').t`Credits`}</div>
                        <div className="flex-autogrid-item">
                            <LinkButton className="p0" onClick={handleOpenCreditsModal}>{c('Action')
                                .t`Add credits`}</LinkButton>
                        </div>
                        <div className="flex-autogrid-item text-bold text-right">{Credit / 100}</div>
                    </div>
                    <div className="flex-autogrid on-mobile-flex-column w100">
                        <div className="flex-autogrid-item">
                            {c('Label').t`Gift code`}{' '}
                            <Info
                                title={c('Info')
                                    .t`If you purchased a gift code or received one from our support team, you can enter it here.`}
                            />
                        </div>
                        <div className="flex-autogrid-item">
                            <LinkButton className="p0" onClick={handleOpenGiftCodeModal}>{c('Action')
                                .t`Use gift code`}</LinkButton>
                        </div>
                        <div className="flex-autogrid-item" />
                    </div>
                </div>
            </>
        );
    }

    if (loadingSubscription || loadingPlans || loadingOrganization) {
        return <Loader />;
    }

    if (subscription.ManagedByMozilla) {
        return <MozillaInfoPanel />;
    }

    const { Plans = [], Cycle, Currency, CouponCode, Amount, PeriodEnd } = subscription;
    const { mailPlan, vpnPlan, addressAddon, domainAddon, memberAddon, vpnAddon, spaceAddon } = formatPlans(Plans);
    const subTotal = unique(Plans.map(({ Name }) => Name)).reduce((acc, planName) => {
        return acc + getMonthlyBaseAmount(planName, plans, subscription);
    }, 0);
    const discount = Amount / Cycle - subTotal;
    const spaceBonus = organization?.BonusSpace;
    const vpnBonus = organization?.BonusVPN;

    return (
        <>
            <Alert>{c('Info').t`We always use credits before charging your saved payment method.`}</Alert>
            <div className="shadow-norm">
                {hasPaidMail ? (
                    <div className="border-bottom pt1 pl1 pr1 on-mobile-pb1">
                        {mailPlan ? (
                            <div className="flex-autogrid flex-align-items-center w100 mb1">
                                <div className="flex-autogrid-item">
                                    {c('Label').t`ProtonMail plan`}
                                    <div className="hidden auto-mobile text-bold">{PLAN_NAMES[mailPlan.Name]}</div>
                                </div>
                                <div className="flex-autogrid-item text-bold no-mobile">
                                    {PLAN_NAMES[mailPlan.Name]}
                                </div>
                                <div className="flex-autogrid-item text-bold text-right">
                                    <PlanPrice
                                        amount={getMonthlyBaseAmount(mailPlan.Name, plans, subscription)}
                                        currency={Currency}
                                        cycle={MONTHLY}
                                    />
                                </div>
                            </div>
                        ) : null}
                        {memberAddon ? (
                            <div className="flex-autogrid flex-align-items-center w100 mb1">
                                <div className="flex-autogrid-item">
                                    {c('Label').t`Extra users`}
                                    <div className="hidden auto-mobile text-bold">
                                        +
                                        {c('Addon unit for subscription').ngettext(
                                            msgid`${memberAddon.MaxMembers} user`,
                                            `${memberAddon.MaxMembers} users`,
                                            memberAddon.MaxMembers
                                        )}
                                    </div>
                                </div>
                                <div className="flex-autogrid-item text-bold no-mobile">
                                    +
                                    {c('Addon unit for subscription').ngettext(
                                        msgid`${memberAddon.MaxMembers} user`,
                                        `${memberAddon.MaxMembers} users`,
                                        memberAddon.MaxMembers
                                    )}
                                </div>
                                <div className="flex-autogrid-item text-bold text-right">
                                    <PlanPrice
                                        amount={getMonthlyBaseAmount(memberAddon.Name, plans, subscription)}
                                        currency={Currency}
                                        cycle={MONTHLY}
                                    />
                                </div>
                            </div>
                        ) : null}
                        {addressAddon ? (
                            <div className="flex-autogrid w100 mb1">
                                <div className="flex-autogrid-item">
                                    {c('Label').t`Extra email addresses`}
                                    <div className="hidden auto-mobile text-bold">
                                        +
                                        {c('Addon unit for subscription').ngettext(
                                            msgid`${addressAddon.MaxAddresses} address`,
                                            `${addressAddon.MaxAddresses} addresses`,
                                            addressAddon.MaxAddresses
                                        )}
                                    </div>
                                </div>
                                <div className="flex-autogrid-item text-bold no-mobile">
                                    +
                                    {c('Addon unit for subscription').ngettext(
                                        msgid`${addressAddon.MaxAddresses} address`,
                                        `${addressAddon.MaxAddresses} addresses`,
                                        addressAddon.MaxAddresses
                                    )}
                                </div>
                                <div className="flex-autogrid-item text-bold text-right">
                                    <PlanPrice
                                        amount={getMonthlyBaseAmount(addressAddon.Name, plans, subscription)}
                                        currency={Currency}
                                        cycle={MONTHLY}
                                    />
                                </div>
                            </div>
                        ) : null}
                        {spaceAddon ? (
                            <div className="flex-autogrid w100 mb1">
                                <div className="flex-autogrid-item">
                                    {c('Label').t`Extra storage`}
                                    <div className="hidden auto-mobile text-bold">
                                        +{humanSize(spaceAddon.MaxSpace)}
                                    </div>
                                </div>
                                <div className="flex-autogrid-item text-bold no-mobile">
                                    +{humanSize(spaceAddon.MaxSpace)}
                                </div>
                                <div className="flex-autogrid-item text-bold text-right">
                                    <PlanPrice
                                        amount={getMonthlyBaseAmount(spaceAddon.Name, plans, subscription)}
                                        currency={Currency}
                                        cycle={MONTHLY}
                                    />
                                </div>
                            </div>
                        ) : null}
                        {spaceBonus ? (
                            <div className="flex-autogrid w100 mb1">
                                <div className="flex-autogrid-item">
                                    {c('Label').t`Bonus storage`}
                                    <div className="hidden auto-mobile text-bold">+{humanSize(spaceBonus)}</div>
                                </div>
                                <div className="flex-autogrid-item text-bold no-mobile">+{humanSize(spaceBonus)}</div>
                                <div className="flex-autogrid-item text-bold text-right">
                                    <PlanPrice amount={0} currency={Currency} cycle={MONTHLY} />
                                </div>
                            </div>
                        ) : null}
                        {domainAddon ? (
                            <div className="flex-autogrid w100 mb1">
                                <div className="flex-autogrid-item">
                                    {c('Label').t`Extra domains`}
                                    <div className="hidden auto-mobile text-bold">
                                        +
                                        {c('Addon unit for subscription').ngettext(
                                            msgid`${domainAddon.MaxDomains} domain`,
                                            `${domainAddon.MaxDomains} domains`,
                                            domainAddon.MaxDomains
                                        )}
                                    </div>
                                </div>
                                <div className="flex-autogrid-item text-bold no-mobile">
                                    +
                                    {c('Addon unit for subscription').ngettext(
                                        msgid`${domainAddon.MaxDomains} domain`,
                                        `${domainAddon.MaxDomains} domains`,
                                        domainAddon.MaxDomains
                                    )}
                                </div>
                                <div className="flex-autogrid-item text-bold text-right">
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
                    <div className="border-bottom pt1 pl1 pr1 on-mobile-pb1">
                        {vpnPlan ? (
                            <div className="flex-autogrid w100 mb1">
                                <div className="flex-autogrid-item">
                                    {c('Label').t`ProtonVPN plan`}
                                    <div className="hidden auto-mobile text-bold">{PLAN_NAMES[vpnPlan.Name]}</div>
                                </div>
                                <div className="flex-autogrid-item text-bold no-mobile">{PLAN_NAMES[vpnPlan.Name]}</div>
                                <div className="flex-autogrid-item text-bold text-right">
                                    <PlanPrice
                                        amount={getMonthlyBaseAmount(vpnPlan.Name, plans, subscription)}
                                        currency={Currency}
                                        cycle={MONTHLY}
                                    />
                                </div>
                            </div>
                        ) : null}
                        {vpnAddon ? (
                            <div className="flex-autogrid w100 mb1">
                                <div className="flex-autogrid-item">
                                    {c('Label').t`Extra connections`}
                                    <div className="hidden auto-mobile text-bold">
                                        +
                                        {c('Addon unit for subscription').ngettext(
                                            msgid`${vpnAddon.MaxVPN} connection`,
                                            `${vpnAddon.MaxVPN} connections`,
                                            vpnAddon.MaxVPN
                                        )}
                                    </div>
                                </div>
                                <div className="flex-autogrid-item text-bold no-mobile">
                                    +
                                    {c('Addon unit for subscription').ngettext(
                                        msgid`${vpnAddon.MaxVPN} connection`,
                                        `${vpnAddon.MaxVPN} connections`,
                                        vpnAddon.MaxVPN
                                    )}
                                </div>
                                <div className="flex-autogrid-item text-bold text-right">
                                    <PlanPrice
                                        amount={getMonthlyBaseAmount(vpnAddon.Name, plans, subscription)}
                                        currency={Currency}
                                        cycle={MONTHLY}
                                    />
                                </div>
                            </div>
                        ) : null}
                        {vpnBonus ? (
                            <div className="flex-autogrid w100 mb1">
                                <div className="flex-autogrid-item">
                                    {c('Label').t`Bonus connections`}
                                    <div className="hidden auto-mobile text-bold">
                                        +
                                        {c('Addon unit for subscription').ngettext(
                                            msgid`${vpnBonus} connection`,
                                            `${vpnBonus} connections`,
                                            vpnBonus
                                        )}
                                    </div>
                                </div>
                                <div className="flex-autogrid-item text-bold no-mobile">
                                    +
                                    {c('Addon unit for subscription').ngettext(
                                        msgid`${vpnBonus} connection`,
                                        `${vpnBonus} connections`,
                                        vpnBonus
                                    )}
                                </div>
                                <div className="flex-autogrid-item text-bold text-right">
                                    <PlanPrice amount={0} currency={Currency} cycle={MONTHLY} />
                                </div>
                            </div>
                        ) : null}
                    </div>
                ) : null}
                {CouponCode || [YEARLY, TWO_YEARS].includes(Cycle) ? (
                    <div className="border-bottom pt1 pl1 pr1 on-mobile-pb1">
                        <div className="flex-autogrid w100 mb1">
                            <div className="flex-autogrid-item h4 mb0">{c('Label').t`Subtotal`}</div>
                            <div className="flex-autogrid-item h4 mb0 text-bold text-right">
                                <PlanPrice amount={subTotal} currency={Currency} cycle={MONTHLY} />
                            </div>
                        </div>
                        <div className="flex-autogrid w100 mb1">
                            <div className="flex-autogrid-item">
                                {c('Label').t`Discount`}
                                <div className="hidden auto-mobile text-bold">
                                    {CouponCode ? (
                                        <>
                                            <code className="text-bold mr1">{CouponCode}</code>
                                            <DiscountBadge code={CouponCode} />
                                        </>
                                    ) : (
                                        <CycleDiscountBadge cycle={Cycle} />
                                    )}
                                </div>
                            </div>
                            <div className="flex-autogrid-item no-mobile">
                                {CouponCode ? (
                                    <>
                                        <code className="text-bold mr1">{CouponCode}</code>
                                        <DiscountBadge code={CouponCode} />
                                    </>
                                ) : (
                                    <CycleDiscountBadge cycle={Cycle} />
                                )}
                            </div>
                            <div className="flex-autogrid-item text-bold text-right">
                                <PlanPrice amount={discount} currency={Currency} cycle={MONTHLY} />
                            </div>
                        </div>
                    </div>
                ) : null}
                <div className="pt1 pl1 pr1">
                    <div className="flex-autogrid w100 mb1">
                        <div className="flex-autogrid-item h4 mb0">{c('Label').t`Total`}</div>
                        <div className="flex-autogrid-item h4 mb0 text-bold text-right">
                            <PlanPrice amount={Amount} currency={Currency} cycle={Cycle} />
                        </div>
                    </div>
                </div>
                <div className="bg-weak pt1 pl1 pr1">
                    <div className="flex-autogrid w100 mb1">
                        <div className="flex-autogrid-item">
                            {c('Label').t`Billing cycle`}
                            <div className="hidden auto-mobile">
                                {Cycle === MONTHLY ? (
                                    <LinkButton className="p0 text-left" onClick={handleOpenSubscriptionModal}>{c(
                                        'Action'
                                    ).t`Pay annually and save 20%!`}</LinkButton>
                                ) : null}
                            </div>
                        </div>
                        <div className="flex-autogrid-item no-mobile">
                            {Cycle === MONTHLY ? (
                                <LinkButton className="p0 text-left" onClick={handleOpenSubscriptionModal}>{c('Action')
                                    .t`Pay annually and save 20%!`}</LinkButton>
                            ) : null}
                        </div>
                        <div className="flex-autogrid-item text-bold text-right">{i18n[Cycle]}</div>
                    </div>
                    <div className="flex-autogrid w100 mb1">
                        <div className="flex-autogrid-item">{c('Label').t`Renewal date`}</div>
                        <div className="flex-autogrid-item text-bold text-right">
                            <Time>{PeriodEnd}</Time>
                        </div>
                    </div>
                    <div className="flex-autogrid w100 mb1">
                        <div className="flex-autogrid-item">
                            {c('Label').t`Credits`}
                            <div className="hidden auto-mobile">
                                <LinkButton className="p0" onClick={handleOpenCreditsModal}>{c('Action')
                                    .t`Add credits`}</LinkButton>
                            </div>
                        </div>
                        <div className="flex-autogrid-item no-mobile">
                            <LinkButton className="p0 text-left" onClick={handleOpenCreditsModal}>{c('Action')
                                .t`Add credits`}</LinkButton>
                        </div>
                        <div className="flex-autogrid-item text-bold text-right">{Credit / 100}</div>
                    </div>
                    <div className="flex-autogrid w100">
                        <div className="flex-autogrid-item">
                            {c('Label').t`Gift code`}{' '}
                            <Info
                                title={c('Info')
                                    .t`If you purchased a gift code or received one from our support team, you can enter it here.`}
                            />
                            <div className="hidden auto-mobile">
                                <LinkButton className="p0 text-left" onClick={handleOpenGiftCodeModal}>{c('Action')
                                    .t`Use gift code`}</LinkButton>
                            </div>
                        </div>
                        <div className="flex-autogrid-item no-mobile">
                            <LinkButton className="p0" onClick={handleOpenGiftCodeModal}>{c('Action')
                                .t`Use gift code`}</LinkButton>
                        </div>
                        <div className="flex-autogrid-item" />
                    </div>
                </div>
            </div>
        </>
    );
};

BillingSection.propTypes = {
    permission: PropTypes.bool,
};

export default BillingSection;
