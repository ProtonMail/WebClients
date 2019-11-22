import React from 'react';
import PropTypes from 'prop-types';
import { c, msgid } from 'ttag';
import { PLAN_NAMES, CYCLE, LOYAL_BONUS_STORAGE, LOYAL_BONUS_CONNECTION } from 'proton-shared/lib/constants';
import { isLoyal } from 'proton-shared/lib/helpers/organization';
import {
    Alert,
    SubTitle,
    Price,
    Loader,
    MozillaInfoPanel,
    LinkButton,
    Time,
    Info,
    useUser,
    useSubscription,
    useOrganization,
    useModals,
    usePlans
} from 'react-components';
import { getMonthlyBaseAmount, hasVisionary } from 'proton-shared/lib/helpers/subscription';

import { formatPlans, toPlanNames } from './subscription/helpers';
import DiscountBadge from './DiscountBadge';
import GiftCodeModal from './GiftCodeModal';
import CreditsModal from './CreditsModal';
import PlanPrice from './subscription/PlanPrice';
import SubscriptionModal from './subscription/SubscriptionModal';
import humanSize from 'proton-shared/lib/helpers/humanSize';

const { MONTHLY, YEARLY, TWO_YEARS } = CYCLE;

const getCyclesI18N = () => ({
    [MONTHLY]: c('Billing cycle').t`Monthly`,
    [YEARLY]: c('Billing cycle').t`Yearly`,
    [TWO_YEARS]: c('Billing cycle').t`2-year`
});

/**
 * Define sub-total from current subscription
 * @param {Array} plans coming from Subscription API
 * @returns {Number} subTotal
 */
const getSubTotal = (plans = []) => {
    const config = formatPlans(plans);

    return Object.entries(config).reduce((acc, [, { Amount }]) => {
        return acc + Amount;
    }, 0);
};

const BillingSection = ({ permission }) => {
    const i18n = getCyclesI18N();
    const { createModal } = useModals();
    const [{ hasPaidMail, hasPaidVpn, Credit }] = useUser();
    const [plans, loadingPlans] = usePlans();
    const [subscription, loadingSubscription] = useSubscription();
    const [organization, loadingOrganization] = useOrganization();
    const handleOpenGiftCodeModal = () => createModal(<GiftCodeModal />);
    const handleOpenCreditsModal = () => createModal(<CreditsModal />);
    const handleOpenSubscriptionModal = () =>
        createModal(
            <SubscriptionModal
                subscription={subscription}
                plansMap={toPlanNames(subscription.Plans)}
                coupon={subscription.CouponCode}
                currency={subscription.Currency}
                cycle={YEARLY}
            />
        );

    if (!permission) {
        return (
            <>
                <SubTitle>{c('Title').t`Billing details`}</SubTitle>
                <Alert>{c('Info').t`There are no billing details available for your current subscription.`}</Alert>
                <div className="shadow-container mb1">
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

    if (loadingSubscription || loadingPlans || loadingOrganization) {
        return (
            <>
                <SubTitle>{c('Title').t`Billing details`}</SubTitle>
                <Loader />
            </>
        );
    }

    if (subscription.ManagedByMozilla) {
        return (
            <>
                <SubTitle>{c('Title').t`Billing details`}</SubTitle>
                <MozillaInfoPanel />
            </>
        );
    }

    const { Plans = [], Cycle, Currency, CouponCode, Amount, PeriodEnd } = subscription;
    const { mailPlan, vpnPlan, addressAddon, domainAddon, memberAddon, vpnAddon, spaceAddon } = formatPlans(Plans);
    const subTotal = getSubTotal(Plans);
    const discount = Amount - subTotal;
    const loyal = isLoyal(organization);

    return (
        <>
            <SubTitle>{c('Title').t`Billing details`}</SubTitle>
            <Alert>{c('Info').t`We always use credits before charging your saved payment method.`}</Alert>
            <div className="shadow-container">
                {hasPaidMail ? (
                    <div className="border-bottom pt1 pl1 pr1">
                        {mailPlan ? (
                            <div className="flex-autogrid onmobile-flex-column w100 mb1">
                                <div className="flex-autogrid-item">{c('Label').t`ProtonMail plan`}</div>
                                <div className="flex-autogrid-item bold">{PLAN_NAMES[mailPlan.Name]}</div>
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
                            <div className="flex-autogrid onmobile-flex-column w100 mb1">
                                <div className="flex-autogrid-item">{c('Label').t`Extra users`}</div>
                                <div className="flex-autogrid-item bold">
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
                            <div className="flex-autogrid onmobile-flex-column w100 mb1">
                                <div className="flex-autogrid-item">{c('Label').t`Extra email addresses`}</div>
                                <div className="flex-autogrid-item bold">
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
                            <div className="flex-autogrid onmobile-flex-column w100 mb1">
                                <div className="flex-autogrid-item">{c('Label').t`Extra storage`}</div>
                                <div className="flex-autogrid-item bold">+{humanSize(spaceAddon.MaxSpace)}</div>
                                <div className="flex-autogrid-item bold alignright">
                                    <PlanPrice
                                        amount={getMonthlyBaseAmount(spaceAddon.Name, plans, subscription)}
                                        currency={Currency}
                                        cycle={MONTHLY}
                                    />
                                </div>
                            </div>
                        ) : null}
                        {loyal ? (
                            <div className="flex-autogrid onmobile-flex-column w100 mb1">
                                <div className="flex-autogrid-item">{c('Label').t`Bonus storage`}</div>
                                <div className="flex-autogrid-item bold">+{humanSize(LOYAL_BONUS_STORAGE)}</div>
                                <div className="flex-autogrid-item bold alignright">
                                    <PlanPrice amount={0} currency={Currency} cycle={MONTHLY} />
                                </div>
                            </div>
                        ) : null}
                        {domainAddon ? (
                            <div className="flex-autogrid onmobile-flex-column w100 mb1">
                                <div className="flex-autogrid-item">{c('Label').t`Extra domains`}</div>
                                <div className="flex-autogrid-item bold">
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
                    <div className="border-bottom pt1 pl1 pr1">
                        {vpnPlan ? (
                            <div className="flex-autogrid onmobile-flex-column w100 mb1">
                                <div className="flex-autogrid-item">{c('Label').t`ProtonVPN plan`}</div>
                                <div className="flex-autogrid-item bold">{PLAN_NAMES[vpnPlan.Name]}</div>
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
                            <div className="flex-autogrid onmobile-flex-column w100 mb1">
                                <div className="flex-autogrid-item">{c('Label').t`Extra connections`}</div>
                                <div className="flex-autogrid-item bold">
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
                        {loyal ? (
                            <div className="flex-autogrid onmobile-flex-column w100 mb1">
                                <div className="flex-autogrid-item">{c('Label').t`Bonus connections`}</div>
                                <div className="flex-autogrid-item bold">
                                    +
                                    {c('Addon unit for subscription').ngettext(
                                        msgid`${LOYAL_BONUS_CONNECTION} connection`,
                                        `${LOYAL_BONUS_CONNECTION} connections`,
                                        LOYAL_BONUS_CONNECTION
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
                    <div className="border-bottom pt1 pl1 pr1">
                        <div className="flex-autogrid onmobile-flex-column w100 mb1">
                            <div className="flex-autogrid-item h4 mb0">{c('Label').t`Sub-total`}</div>
                            <div className="flex-autogrid-item" />
                            <div className="flex-autogrid-item h4 mb0 bold alignright">
                                <PlanPrice amount={subTotal} currency={Currency} cycle={MONTHLY} />
                            </div>
                        </div>
                        <div className="flex-autogrid onmobile-flex-column w100 mb1">
                            <div className="flex-autogrid-item">{c('Label').t`Discount`}</div>
                            <div className="flex-autogrid-item">
                                {CouponCode ? <code className="bold mr1">{CouponCode}</code> : null}
                                <DiscountBadge code={CouponCode} cycle={Cycle} />
                            </div>
                            <div className="flex-autogrid-item bold alignright">
                                <PlanPrice amount={discount} currency={Currency} cycle={MONTHLY} />
                            </div>
                        </div>
                    </div>
                ) : null}
                <div className="pt1 pl1 pr1">
                    <div className="flex-autogrid onmobile-flex-column w100 mb1">
                        <div className="flex-autogrid-item h4 mb0">{c('Label').t`Total`}</div>
                        <div className="flex-autogrid-item" />
                        <div className="flex-autogrid-item h4 mb0 bold alignright">
                            <PlanPrice amount={Amount} currency={Currency} cycle={Cycle} />
                        </div>
                    </div>
                </div>
                <div className="bg-global-light pt1 pl1 pr1">
                    <div className="flex-autogrid onmobile-flex-column w100 mb1">
                        <div className="flex-autogrid-item">{c('Label').t`Billing cycle`}</div>
                        <div className="flex-autogrid-item">
                            {Cycle === MONTHLY ? (
                                <LinkButton className="p0" onClick={handleOpenSubscriptionModal}>{c('Action')
                                    .t`Pay annualy and save 20%!`}</LinkButton>
                            ) : null}
                        </div>
                        <div className="flex-autogrid-item bold alignright">{i18n[Cycle]}</div>
                    </div>
                    <div className="flex-autogrid onmobile-flex-column w100 mb1">
                        <div className="flex-autogrid-item">{c('Label').t`Renewal date`}</div>
                        <div className="flex-autogrid-item" />
                        <div className="flex-autogrid-item bold alignright">
                            <Time>{PeriodEnd}</Time>
                        </div>
                    </div>
                    <div className="flex-autogrid onmobile-flex-column w100 mb1">
                        <div className="flex-autogrid-item">{c('Label').t`Amount due`}</div>
                        <div className="flex-autogrid-item" />
                        <div className="flex-autogrid-item bold alignright">
                            <Price currency={Currency}>{Amount}</Price>
                        </div>
                    </div>
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
            </div>
        </>
    );
};

BillingSection.propTypes = {
    permission: PropTypes.bool
};

export default BillingSection;
