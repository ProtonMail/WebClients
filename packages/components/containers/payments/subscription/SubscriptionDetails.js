import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { SmallButton, useToggle } from 'react-components';
import { PLAN_SERVICES, COUPON_CODES } from 'proton-shared/lib/constants';

import { getSubTotal, getPlan } from './helpers';
import PlanPrice from './PlanPrice';
import CycleDiscountBadge from '../CycleDiscountBadge';
import CouponDiscountBadge from '../CouponDiscountBadge';
import CouponForm from './CouponForm';

const { BUNDLE } = COUPON_CODES;
const { MAIL, VPN } = PLAN_SERVICES;

const getTitlesI18N = () => ({
    mailfree: `ProtonMail (${c('Info').t`no subscription`})`,
    vpnfree: `ProtonVPN (${c('Info').t`no subscription`})`,
    plus: 'ProtonMail Plus',
    professional: 'ProtonMail Professional',
    visionary: 'Proton Visionary',
    vpnplus: 'ProtonVPN Plus',
    vpnbasic: 'ProtonVPN Basic'
});

const Rows = ({ model, plans }) => {
    const { visionary, plus, vpnbasic, vpnplus, professional } = model.plansMap;
    const i18n = getTitlesI18N();

    if (visionary) {
        const visionaryPlan = getPlan(plans, { name: 'visionary' });
        return (
            <div className="flex flex-spacebetween mb1">
                <div>{i18n.visionary}</div>
                <div>
                    <PlanPrice
                        amount={visionaryPlan.Pricing[model.cycle]}
                        cycle={model.cycle}
                        currency={model.currency}
                    />
                </div>
            </div>
        );
    }

    const mailPlanName = plus ? 'plus' : professional ? 'professional' : '';
    const vpnPlanName = vpnbasic ? 'vpnbasic' : vpnplus ? 'vpnplus' : '';
    const mailPlan = mailPlanName ? getPlan(plans, { name: mailPlanName }) : '';
    const vpnPlan = vpnPlanName ? getPlan(plans, { name: vpnPlanName }) : '';
    const mailSubTotal = getSubTotal({ ...model, plans, services: MAIL });
    const vpnSubTotal = getSubTotal({ ...model, plans, services: VPN });
    const mailTitle = `${plus || professional ? (plus ? i18n.plus : i18n.professional) : i18n.mailfree}`;
    const vpnTitle = `${vpnbasic || vpnplus ? (vpnbasic ? i18n.vpnbasic : i18n.vpnplus) : i18n.vpnfree}`;

    return (
        <>
            <div className="flex flex-spacebetween mb1">
                <div>
                    {mailTitle} {plus || professional ? <CycleDiscountBadge cycle={model.cycle} /> : null}
                </div>
                <div>
                    {mailPlan ? (
                        <PlanPrice amount={mailSubTotal} cycle={model.cycle} currency={model.currency} />
                    ) : (
                        c('Price').t`Free`
                    )}
                </div>
            </div>
            <div className="flex flex-spacebetween mb1 pb1 border-bottom">
                <div>
                    {vpnTitle} {vpnbasic || vpnplus ? <CycleDiscountBadge cycle={model.cycle} /> : null}
                </div>
                <div>
                    {vpnPlan ? (
                        <PlanPrice amount={vpnSubTotal} cycle={model.cycle} currency={model.currency} />
                    ) : (
                        c('Price').t`Free`
                    )}
                </div>
            </div>
        </>
    );
};

Rows.propTypes = {
    model: PropTypes.object,
    plans: PropTypes.array
};

const SubscriptionDetails = ({ model, plans, check, onChange }) => {
    const subTotal = getSubTotal({ ...model, plans });
    const { state, toggle } = useToggle();
    const handleRemoveCoupon = () => onChange({ ...model, coupon: '' }, true);
    const canRemoveCoupon = model.coupon !== BUNDLE;

    return (
        <>
            <div className="uppercase bold small mb1">{c('Title').t`Subscription details`}</div>
            <Rows model={model} plans={plans} />
            {model.coupon ? (
                <div className="flex flex-spacebetween mb1 pb1 border-bottom">
                    <div className="bold">{c('Label').t`Sub-total`}</div>
                    <div className="bold">
                        <PlanPrice amount={subTotal} cycle={model.cycle} currency={model.currency} />
                    </div>
                </div>
            ) : null}
            {model.coupon ? (
                <div className="flex flex-spacebetween mb1 pb1 border-bottom">
                    <div>
                        <span className="mr0-5">
                            {c('Label').t`Coupon`} {model.coupon}
                        </span>
                        <CouponDiscountBadge code={model.coupon} />
                        {canRemoveCoupon ? (
                            <SmallButton className="pm-button--link" onClick={handleRemoveCoupon}>{c('Action')
                                .t`Remove coupon`}</SmallButton>
                        ) : null}
                    </div>
                    <div>
                        <PlanPrice
                            className="color-global-success"
                            amount={check.Amount - subTotal}
                            cycle={model.cycle}
                            currency={model.currency}
                        />
                    </div>
                </div>
            ) : null}
            <div className="flex flex-spacebetween">
                <div className="bold">{c('Label').t`Total`}</div>
                <div className="bold">
                    <PlanPrice amount={check.Amount} cycle={model.cycle} currency={model.currency} />
                </div>
            </div>
            {model.coupon ? null : (
                <div className="mt1">
                    {state ? (
                        <CouponForm model={model} onChange={onChange} />
                    ) : (
                        <SmallButton className="pm-button--link" onClick={toggle}>{c('Action')
                            .t`Add coupon`}</SmallButton>
                    )}
                </div>
            )}
        </>
    );
};

SubscriptionDetails.propTypes = {
    plans: PropTypes.array.isRequired,
    model: PropTypes.object.isRequired,
    check: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired
};

export default SubscriptionDetails;
