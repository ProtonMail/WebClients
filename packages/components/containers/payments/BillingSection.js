import React from 'react';
import { c } from 'ttag';
import { PLAN_NAMES, CYCLE } from 'proton-shared/lib/constants';
import {
    SubTitle,
    Price,
    Loader,
    MozillaInfoPanel,
    SmallButton,
    Time,
    useUser,
    useSubscription,
    useModals
} from 'react-components';

import { formatPlans } from './subscription/helpers';
import CycleDiscountBadge from './CycleDiscountBadge';
import CouponDiscountBadge from './CouponDiscountBadge';
import GiftCodeModal from './GiftCodeModal';
import CreditsModal from './CreditsModal';
import PlanPrice from './subscription/PlanPrice';

const { MONTHLY, YEARLY, TWO_YEARS } = CYCLE;

const CYCLES = {
    [MONTHLY]: c('Billing cycle').t`Monthly`,
    [YEARLY]: c('Billing cycle').t`Yearly`,
    [TWO_YEARS]: c('Billing cycle').t`2-year`
};

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

const BillingSection = () => {
    const { createModal } = useModals();
    const [{ hasPaidMail, hasPaidVpn, Credit }] = useUser();
    const [
        { Plans = [], Cycle, Currency, CouponCode, Amount, PeriodEnd, isManagedByMozilla } = {},
        loadingSubscription
    ] = useSubscription();

    if (isManagedByMozilla) {
        return (
            <>
                <SubTitle>{c('Title').t`Billing details`}</SubTitle>
                <MozillaInfoPanel />
            </>
        );
    }

    if (loadingSubscription) {
        return (
            <>
                <SubTitle>{c('Title').t`Billing details`}</SubTitle>
                <Loader />
            </>
        );
    }

    const { mailPlan, vpnPlan, addressAddon, domainAddon, memberAddon, vpnAddon, spaceAddon } = formatPlans(Plans);
    const subTotal = getSubTotal(Plans);

    const handleOpenGiftCodeModal = () => createModal(<GiftCodeModal />);
    const handleOpenCreditsModal = () => createModal(<CreditsModal />);

    return (
        <>
            <SubTitle>{c('Title').t`Billing details`}</SubTitle>
            <div className="shadow-container">
                <div className="p1">
                    {hasPaidMail ? (
                        <div className="flex-autogrid onmobile-flex-column w100 mb1">
                            <div className="flex-autogrid-item">ProtonMail plan</div>
                            <div className="flex-autogrid-item bold">{PLAN_NAMES[mailPlan.Name]}</div>
                            <div className="flex-autogrid-item bold">
                                <PlanPrice
                                    amount={mailPlan.Amount}
                                    currency={mailPlan.Currency}
                                    cycle={mailPlan.Cycle}
                                />
                            </div>
                            <div className="flex-autogrid-item alignright">
                                <CycleDiscountBadge cycle={Cycle} />
                            </div>
                        </div>
                    ) : null}
                    {memberAddon ? (
                        <div className="flex-autogrid onmobile-flex-column w100 mb1">
                            <div className="flex-autogrid-item">{c('Label').t`Extra users`}</div>
                            <div className="flex-autogrid-item bold">+{memberAddon.MaxMembers}</div>
                            <div className="flex-autogrid-item bold">
                                <PlanPrice
                                    amount={memberAddon.Amount}
                                    currency={memberAddon.Currency}
                                    cycle={memberAddon.Cycle}
                                />
                            </div>
                            <div className="flex-autogrid-item alignright">
                                <CycleDiscountBadge cycle={Cycle} />
                            </div>
                        </div>
                    ) : null}
                    {addressAddon ? (
                        <div className="flex-autogrid onmobile-flex-column w100 mb1">
                            <div className="flex-autogrid-item">{c('Label').t`Extra email addresses`}</div>
                            <div className="flex-autogrid-item bold">+{addressAddon.MaxAddresses}</div>
                            <div className="flex-autogrid-item bold">
                                <PlanPrice
                                    amount={addressAddon.Amount}
                                    currency={addressAddon.Currency}
                                    cycle={addressAddon.Cycle}
                                />
                            </div>
                            <div className="flex-autogrid-item alignright">
                                <CycleDiscountBadge cycle={Cycle} />
                            </div>
                        </div>
                    ) : null}
                    {spaceAddon ? (
                        <div className="flex-autogrid onmobile-flex-column w100 mb1">
                            <div className="flex-autogrid-item">{c('Label').t`Extra storage`}</div>
                            <div className="flex-autogrid-item bold">+{spaceAddon.MaxSpace}</div>
                            <div className="flex-autogrid-item bold">
                                <PlanPrice
                                    amount={spaceAddon.Amount}
                                    currency={spaceAddon.Currency}
                                    cycle={spaceAddon.Cycle}
                                />
                            </div>
                            <div className="flex-autogrid-item alignright">
                                <CycleDiscountBadge cycle={Cycle} />
                            </div>
                        </div>
                    ) : null}
                    {domainAddon ? (
                        <div className="flex-autogrid onmobile-flex-column w100 mb1">
                            <div className="flex-autogrid-item">{c('Label').t`Extra domains`}</div>
                            <div className="flex-autogrid-item bold">+{domainAddon.MaxDomains}</div>
                            <div className="flex-autogrid-item bold">
                                <PlanPrice
                                    amount={domainAddon.Amount}
                                    currency={domainAddon.Currency}
                                    cycle={domainAddon.Cycle}
                                />
                            </div>
                            <div className="flex-autogrid-item alignright">
                                <CycleDiscountBadge cycle={Cycle} />
                            </div>
                        </div>
                    ) : null}
                    {hasPaidVpn ? (
                        <div className="flex-autogrid onmobile-flex-column w100 mb1">
                            <div className="flex-autogrid-item">ProtonVPN plan</div>
                            <div className="flex-autogrid-item bold">{PLAN_NAMES[vpnPlan.Name]}</div>
                            <div className="flex-autogrid-item bold">
                                <PlanPrice amount={vpnPlan.Amount} currency={vpnPlan.Currency} cycle={vpnPlan.Cycle} />
                            </div>
                            <div className="flex-autogrid-item alignright">
                                <CycleDiscountBadge cycle={Cycle} />
                            </div>
                        </div>
                    ) : null}
                    {vpnAddon ? (
                        <div className="flex-autogrid onmobile-flex-column w100 mb1">
                            <div className="flex-autogrid-item">{c('Label').t`Extra VPN connections`}</div>
                            <div className="flex-autogrid-item bold">+{vpnAddon.MaxVPN}</div>
                            <div className="flex-autogrid-item bold">
                                <PlanPrice
                                    amount={vpnAddon.Amount}
                                    currency={vpnAddon.Currency}
                                    cycle={vpnAddon.Cycle}
                                />
                            </div>
                            <div className="flex-autogrid-item alignright">
                                <CycleDiscountBadge cycle={Cycle} />
                            </div>
                        </div>
                    ) : null}
                    {CouponCode ? (
                        <div className="flex-autogrid onmobile-flex-column w100 mb1">
                            <div className="flex-autogrid-item">{c('Label').t`Sub-total`}</div>
                            <div className="flex-autogrid-item" />
                            <div className="flex-autogrid-item bold">
                                <PlanPrice amount={subTotal} currency={Currency} cycle={Cycle} />
                            </div>
                            <div className="flex-autogrid-item" />
                        </div>
                    ) : null}
                    {CouponCode ? (
                        <div className="flex-autogrid onmobile-flex-column w100 mb1">
                            <div className="flex-autogrid-item">{c('Label').t`Coupon`}</div>
                            <div className="flex-autogrid-item">
                                <strong>{CouponCode}</strong> <CouponDiscountBadge code={CouponCode} />
                            </div>
                            <div className="flex-autogrid-item bold">
                                <PlanPrice amount={Amount - subTotal} currency={Currency} cycle={Cycle} />
                            </div>
                            <div className="flex-autogrid-item" />
                        </div>
                    ) : null}
                    {Cycle !== MONTHLY ? (
                        <div className="flex-autogrid onmobile-flex-column w100 mb1">
                            <div className="flex-autogrid-item">{c('Label').t`Total`}</div>
                            <div className="flex-autogrid-item" />
                            <div className="flex-autogrid-item bold">
                                <PlanPrice amount={Amount} currency={Currency} cycle={Cycle} />
                            </div>
                            <div className="flex-autogrid-item" />
                        </div>
                    ) : null}
                </div>
                <div className="p1 bg-global-light">
                    <div className="flex-autogrid onmobile-flex-column w100 mb1">
                        <div className="flex-autogrid-item">{c('Label').t`Amount due`}</div>
                        <div className="flex-autogrid-item bold">{CYCLES[Cycle]}</div>
                        <div className="flex-autogrid-item bold">
                            <Price currency={Currency}>{Amount}</Price>
                        </div>
                        <div className="flex-autogrid-item alignright">
                            <SmallButton onClick={handleOpenGiftCodeModal}>{c('Action').t`Use gift code`}</SmallButton>
                        </div>
                    </div>
                    <div className="flex-autogrid onmobile-flex-column w100 mb1">
                        <div className="flex-autogrid-item">{c('Label').t`Credits`}</div>
                        <div className="flex-autogrid-item" />
                        <div className="flex-autogrid-item bold">{Credit / 100}</div>
                        <div className="flex-autogrid-item alignright">
                            <SmallButton onClick={handleOpenCreditsModal}>{c('Action').t`Add credits`}</SmallButton>
                        </div>
                    </div>
                    <div className="flex-autogrid onmobile-flex-column w100">
                        <div className="flex-autogrid-item">{c('Label').t`Billing cycle end date`}</div>
                        <div className="flex-autogrid-item" />
                        <div className="flex-autogrid-item bold">
                            <Time>{PeriodEnd}</Time>
                        </div>
                        <div className="flex-autogrid-item" />
                    </div>
                </div>
            </div>
        </>
    );
};

export default BillingSection;
