import React from 'react';
import PropTypes from 'prop-types';
import { c, msgid } from 'ttag';
import { PLAN_NAMES, CYCLE } from 'proton-shared/lib/constants';
import { unique } from 'proton-shared/lib/helpers/array';
import { getMonthlyBaseAmount, hasVisionary, getPlanIDs } from 'proton-shared/lib/helpers/subscription';
import humanSize from 'proton-shared/lib/helpers/humanSize';

import { Alert, Price, Loader, LinkButton, Time, Info } from '../../components';
import { useUser, useSubscription, useNextSubscription, useOrganization, useModals, usePlans } from '../../hooks';
import MozillaInfoPanel from '../account/MozillaInfoPanel';
import { formatPlans } from './subscription/helpers';
import DiscountBadge from './DiscountBadge';
import GiftCodeModal from './GiftCodeModal';
import CreditsModal from './CreditsModal';
import PlanPrice from './subscription/PlanPrice';
import NewSubscriptionModal from './subscription/NewSubscriptionModal';
import CycleDiscountBadge from './CycleDiscountBadge';

const { MONTHLY, YEARLY, TWO_YEARS } = CYCLE;

const getCyclesI18N = () => ({
    [MONTHLY]: c('Billing cycle').t`Monthly`,
    [YEARLY]: c('Billing cycle').t`Yearly`,
    [TWO_YEARS]: c('Billing cycle').t`2-year`,
});

const BillingSection = ({ permission }) => {
    const i18n = getCyclesI18N();
    const { createModal } = useModals();
    const [{ hasPaidMail, hasPaidVpn, Credit }] = useUser();
    const [plans, loadingPlans] = usePlans();
    const [subscription, loadingSubscription] = useSubscription();
    const [nextSubscription, loadingNextSubscription] = useNextSubscription();
    const [organization, loadingOrganization] = useOrganization();
    const handleOpenGiftCodeModal = () => createModal(<GiftCodeModal />);
    const handleOpenCreditsModal = () => createModal(<CreditsModal />);
    const handleOpenSubscriptionModal = () =>
        createModal(
            <NewSubscriptionModal
                planIDs={getPlanIDs(subscription)}
                coupon={subscription.CouponCode}
                currency={subscription.Currency}
                cycle={YEARLY}
            />
        );

    if (!permission) {
        return (
            <>
                <Alert>{c('Info').t`There are no billing details available for your current subscription.`}</Alert>
                <div className="shadow-container bg-global-highlight mb1 pt1 pl1 pr1">
                    <div className="flex-autogrid onmobile-flex-column w100 mb1">
                        <div className="flex-autogrid-item">{c('Label').t`Credits`}</div>
                        <div className="flex-autogrid-item">
                            <LinkButton className="p0" onClick={handleOpenCreditsModal}>{c('Action')
                                .t`Add credits`}</LinkButton>
                        </div>
                        <div className="flex-autogrid-item bold alignright">{Credit / 100}</div>
                    </div>
                    <div className="flex-autogrid onmobile-flex-column w100">
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

    if (loadingSubscription || loadingPlans || loadingOrganization || loadingNextSubscription) {
        return <Loader />;
    }

    if (subscription.ManagedByMozilla) {
        return <MozillaInfoPanel />;
    }

    console.log({ nextSubscription, loadingNextSubscription });

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
            <div className="shadow-container">
                {hasPaidMail ? (
                    <div className="border-bottom pt1 pl1 pr1 onmobile-pb1">
                        {mailPlan ? (
                            <div className="flex-autogrid flex-items-center w100 mb1">
                                <div className="flex-autogrid-item">
                                    {c('Label').t`ProtonMail plan`}
                                    <div className="hidden automobile bold">{PLAN_NAMES[mailPlan.Name]}</div>
                                </div>
                                <div className="flex-autogrid-item bold nomobile">{PLAN_NAMES[mailPlan.Name]}</div>
                                <div className="flex-autogrid-item bold alignright">
                                    <PlanPrice
                                        amount={getMonthlyBaseAmount(mailPlan.Name, plans, subscription)}
                                        currency={Currency}
                                        cycle={MONTHLY}
                                    />
                                </div>
                            </div>
                        ) : null}
                        {memberAddon ? (
                            <div className="flex-autogrid flex-items-center w100 mb1">
                                <div className="flex-autogrid-item">
                                    {c('Label').t`Extra users`}
                                    <div className="hidden automobile bold">
                                        +
                                        {c('Addon unit for subscription').ngettext(
                                            msgid`${memberAddon.MaxMembers} user`,
                                            `${memberAddon.MaxMembers} users`,
                                            memberAddon.MaxMembers
                                        )}
                                    </div>
                                </div>
                                <div className="flex-autogrid-item bold nomobile">
                                    +
                                    {c('Addon unit for subscription').ngettext(
                                        msgid`${memberAddon.MaxMembers} user`,
                                        `${memberAddon.MaxMembers} users`,
                                        memberAddon.MaxMembers
                                    )}
                                </div>
                                <div className="flex-autogrid-item bold alignright">
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
                                    <div className="hidden automobile bold">
                                        +
                                        {c('Addon unit for subscription').ngettext(
                                            msgid`${addressAddon.MaxAddresses} address`,
                                            `${addressAddon.MaxAddresses} addresses`,
                                            addressAddon.MaxAddresses
                                        )}
                                    </div>
                                </div>
                                <div className="flex-autogrid-item bold nomobile">
                                    +
                                    {c('Addon unit for subscription').ngettext(
                                        msgid`${addressAddon.MaxAddresses} address`,
                                        `${addressAddon.MaxAddresses} addresses`,
                                        addressAddon.MaxAddresses
                                    )}
                                </div>
                                <div className="flex-autogrid-item bold alignright">
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
                                    <div className="hidden automobile bold">+{humanSize(spaceAddon.MaxSpace)}</div>
                                </div>
                                <div className="flex-autogrid-item bold nomobile">
                                    +{humanSize(spaceAddon.MaxSpace)}
                                </div>
                                <div className="flex-autogrid-item bold alignright">
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
                                    <div className="hidden automobile bold">+{humanSize(spaceBonus)}</div>
                                </div>
                                <div className="flex-autogrid-item bold nomobile">+{humanSize(spaceBonus)}</div>
                                <div className="flex-autogrid-item bold alignright">
                                    <PlanPrice amount={0} currency={Currency} cycle={MONTHLY} />
                                </div>
                            </div>
                        ) : null}
                        {domainAddon ? (
                            <div className="flex-autogrid w100 mb1">
                                <div className="flex-autogrid-item">
                                    {c('Label').t`Extra domains`}
                                    <div className="hidden automobile bold">
                                        +
                                        {c('Addon unit for subscription').ngettext(
                                            msgid`${domainAddon.MaxDomains} domain`,
                                            `${domainAddon.MaxDomains} domains`,
                                            domainAddon.MaxDomains
                                        )}
                                    </div>
                                </div>
                                <div className="flex-autogrid-item bold nomobile">
                                    +
                                    {c('Addon unit for subscription').ngettext(
                                        msgid`${domainAddon.MaxDomains} domain`,
                                        `${domainAddon.MaxDomains} domains`,
                                        domainAddon.MaxDomains
                                    )}
                                </div>
                                <div className="flex-autogrid-item bold alignright">
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
                    <div className="border-bottom pt1 pl1 pr1 onmobile-pb1">
                        {vpnPlan ? (
                            <div className="flex-autogrid w100 mb1">
                                <div className="flex-autogrid-item">
                                    {c('Label').t`ProtonVPN plan`}
                                    <div className="hidden automobile bold">{PLAN_NAMES[vpnPlan.Name]}</div>
                                </div>
                                <div className="flex-autogrid-item bold nomobile">{PLAN_NAMES[vpnPlan.Name]}</div>
                                <div className="flex-autogrid-item bold alignright">
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
                                    <div className="hidden automobile bold">
                                        +
                                        {c('Addon unit for subscription').ngettext(
                                            msgid`${vpnAddon.MaxVPN} connection`,
                                            `${vpnAddon.MaxVPN} connections`,
                                            vpnAddon.MaxVPN
                                        )}
                                    </div>
                                </div>
                                <div className="flex-autogrid-item bold nomobile">
                                    +
                                    {c('Addon unit for subscription').ngettext(
                                        msgid`${vpnAddon.MaxVPN} connection`,
                                        `${vpnAddon.MaxVPN} connections`,
                                        vpnAddon.MaxVPN
                                    )}
                                </div>
                                <div className="flex-autogrid-item bold alignright">
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
                                    <div className="hidden automobile bold">
                                        +
                                        {c('Addon unit for subscription').ngettext(
                                            msgid`${vpnBonus} connection`,
                                            `${vpnBonus} connections`,
                                            vpnBonus
                                        )}
                                    </div>
                                </div>
                                <div className="flex-autogrid-item bold nomobile">
                                    +
                                    {c('Addon unit for subscription').ngettext(
                                        msgid`${vpnBonus} connection`,
                                        `${vpnBonus} connections`,
                                        vpnBonus
                                    )}
                                </div>
                                <div className="flex-autogrid-item bold alignright">
                                    <PlanPrice amount={0} currency={Currency} cycle={MONTHLY} />
                                </div>
                            </div>
                        ) : null}
                    </div>
                ) : null}
                {CouponCode || [YEARLY, TWO_YEARS].includes(Cycle) ? (
                    <div className="border-bottom pt1 pl1 pr1 onmobile-pb1">
                        <div className="flex-autogrid w100 mb1">
                            <div className="flex-autogrid-item h4 mb0">{c('Label').t`Subtotal`}</div>
                            <div className="flex-autogrid-item h4 mb0 bold alignright">
                                <PlanPrice amount={subTotal} currency={Currency} cycle={MONTHLY} />
                            </div>
                        </div>
                        <div className="flex-autogrid w100 mb1">
                            <div className="flex-autogrid-item">
                                {c('Label').t`Discount`}
                                <div className="hidden automobile bold">
                                    {CouponCode ? (
                                        <>
                                            <code className="bold mr1">{CouponCode}</code>
                                            <DiscountBadge code={CouponCode} />
                                        </>
                                    ) : (
                                        <CycleDiscountBadge cycle={Cycle} />
                                    )}
                                </div>
                            </div>
                            <div className="flex-autogrid-item nomobile">
                                {CouponCode ? (
                                    <>
                                        <code className="bold mr1">{CouponCode}</code>
                                        <DiscountBadge code={CouponCode} />
                                    </>
                                ) : (
                                    <CycleDiscountBadge cycle={Cycle} />
                                )}
                            </div>
                            <div className="flex-autogrid-item bold alignright">
                                <PlanPrice amount={discount} currency={Currency} cycle={MONTHLY} />
                            </div>
                        </div>
                    </div>
                ) : null}
                <div className="pt1 pl1 pr1">
                    <div className="flex-autogrid w100 mb1">
                        <div className="flex-autogrid-item h4 mb0">{c('Label').t`Total`}</div>
                        <div className="flex-autogrid-item h4 mb0 bold alignright">
                            <PlanPrice amount={Amount} currency={Currency} cycle={Cycle} />
                        </div>
                    </div>
                </div>
                <div className="bg-global-highlight pt1 pl1 pr1">
                    <div className="flex-autogrid w100 mb1">
                        <div className="flex-autogrid-item">
                            {c('Label').t`Billing cycle`}
                            <div className="hidden automobile">
                                {Cycle === MONTHLY ? (
                                    <LinkButton className="p0 alignleft" onClick={handleOpenSubscriptionModal}>{c(
                                        'Action'
                                    ).t`Pay annually and save 20%!`}</LinkButton>
                                ) : null}
                            </div>
                        </div>
                        <div className="flex-autogrid-item nomobile">
                            {Cycle === MONTHLY ? (
                                <LinkButton className="p0 alignleft" onClick={handleOpenSubscriptionModal}>{c('Action')
                                    .t`Pay annually and save 20%!`}</LinkButton>
                            ) : null}
                        </div>
                        <div className="flex-autogrid-item bold alignright">{i18n[Cycle]}</div>
                    </div>
                    <div className="flex-autogrid w100 mb1">
                        <div className="flex-autogrid-item">{c('Label').t`Renewal date`}</div>
                        <div className="flex-autogrid-item bold alignright">
                            <Time>{PeriodEnd}</Time>
                        </div>
                    </div>
                    <div className="flex-autogrid w100 mb1">
                        <div className="flex-autogrid-item">{c('Label').t`Billing amount`}</div>
                        <div className="flex-autogrid-item bold alignright">
                            <Price currency={Currency}>{nextSubscription.AmountDue}</Price>
                        </div>
                    </div>
                    <div className="flex-autogrid w100 mb1">
                        <div className="flex-autogrid-item">
                            {c('Label').t`Credits`}
                            <div className="hidden automobile">
                                <LinkButton className="p0" onClick={handleOpenCreditsModal}>{c('Action')
                                    .t`Add credits`}</LinkButton>
                            </div>
                        </div>
                        <div className="flex-autogrid-item nomobile">
                            <LinkButton className="p0 alignleft" onClick={handleOpenCreditsModal}>{c('Action')
                                .t`Add credits`}</LinkButton>
                        </div>
                        <div className="flex-autogrid-item bold alignright">{Credit / 100}</div>
                    </div>
                    <div className="flex-autogrid w100">
                        <div className="flex-autogrid-item">
                            {c('Label').t`Gift code`}{' '}
                            <Info
                                title={c('Info')
                                    .t`If you purchased a gift code or received one from our support team, you can enter it here.`}
                            />
                            <div className="hidden automobile">
                                <LinkButton className="p0 alignleft" onClick={handleOpenGiftCodeModal}>{c('Action')
                                    .t`Use gift code`}</LinkButton>
                            </div>
                        </div>
                        <div className="flex-autogrid-item nomobile">
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
