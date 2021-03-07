import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { CYCLE, COUPON_CODES, PLANS, PAYMENT_METHOD_TYPES } from 'proton-shared/lib/constants';
import { clearPlanIDs } from 'proton-shared/lib/helpers/planIDs';
import { toMap } from 'proton-shared/lib/helpers/object';
import shieldSvg from 'design-system/assets/img/shared/shield.svg';
import percentageSvg from 'design-system/assets/img/shared/percentage.svg';
import clockSvg from 'design-system/assets/img/shared/clock.svg';
import tickSvg from 'design-system/assets/img/shared/tick.svg';

import { Button, Loader } from '../../../components';
import { useAddresses } from '../../../hooks';
import { SUBSCRIPTION_STEPS } from './constants';

const TickIcon = () => <img className="mr0-5 flex-item-noshrink" src={tickSvg} alt="checkmark" />;
const PercentageIcon = () => <img className="mr0-5 flex-item-noshrink" src={percentageSvg} alt="percentage" />;
const ShieldIcon = () => <img className="mr0-5 flex-item-noshrink" src={shieldSvg} alt="percentage" />;
const ClockIcon = () => <img className="mr0-5 flex-item-noshrink" src={clockSvg} alt="percentage" />;

const NewSubscriptionModalFooter = ({ submit, step, model, plans, onClose, method }) => {
    const plansMap = toMap(plans, 'Name');
    const [addresses, loadingAddresses] = useAddresses();
    const isVisionary = !!model.planIDs[plansMap[PLANS.VISIONARY].ID];
    const hasPaidPlans = Object.keys(clearPlanIDs(model.planIDs)).length;
    const protectedPayment = ![PAYMENT_METHOD_TYPES.CASH, PAYMENT_METHOD_TYPES.BITCOIN].includes(method);
    const onlyVPN =
        (model.planIDs[plansMap[PLANS.VPNBASIC].ID] || model.planIDs[plansMap[PLANS.VPNPLUS].ID]) &&
        !model.planIDs[plansMap[PLANS.PLUS].ID] &&
        !model.planIDs[plansMap[PLANS.PROFESSIONAL].ID];

    if (loadingAddresses) {
        return <Loader />;
    }

    if (step === SUBSCRIPTION_STEPS.NETWORK_ERROR) {
        return <Button onClick={onClose}>{c('Action').t`Close`}</Button>;
    }

    const cancel = step === SUBSCRIPTION_STEPS.CUSTOMIZATION ? c('Action').t`Cancel` : c('Action').t`Back`;

    if (!hasPaidPlans) {
        return (
            <>
                <Button onClick={onClose} className="flex-item-noshrink">
                    {cancel}
                </Button>
                {submit}
            </>
        );
    }

    const hasAddresses = Array.isArray(addresses) && addresses.length > 0;
    const upsells = [
        step === SUBSCRIPTION_STEPS.CUSTOMIZATION && model.cycle === CYCLE.MONTHLY && (
            <div key="upsell-1" className="no-mobile flex flex-nowrap flex-align-items-center pl1 pr1">
                <PercentageIcon />
                <span className="flex-item-fluid">{c('Info').t`Save 20% by switching to annual billing`}</span>
            </div>
        ),
        step === SUBSCRIPTION_STEPS.CUSTOMIZATION && model.cycle === CYCLE.YEARLY && (
            <div key="upsell-2" className="no-mobile flex flex-nowrap flex-align-items-center pl1 pr1">
                <TickIcon />
                <span className="flex-item-fluid">{c('Info').t`You are saving 20% with annual billing`}</span>
            </div>
        ),
        step === SUBSCRIPTION_STEPS.CUSTOMIZATION && model.cycle === CYCLE.TWO_YEARS && (
            <div key="upsell-3" className="no-mobile flex flex-nowrap flex-align-items-center pl1 pr1">
                <TickIcon />
                <span className="flex-item-fluid">{c('Info').t`You are saving 33% with 2-year billing`}</span>
            </div>
        ),
        step === SUBSCRIPTION_STEPS.CUSTOMIZATION &&
            hasAddresses &&
            model.coupon !== COUPON_CODES.BUNDLE &&
            !isVisionary && (
                <div key="upsell-4" className="no-mobile flex flex-nowrap flex-align-items-center pl1 pr1">
                    <PercentageIcon />
                    <span className="flex-item-fluid">{c('Info').t`Save an extra 20% by combining Mail and VPN`}</span>
                </div>
            ),
        step === SUBSCRIPTION_STEPS.CUSTOMIZATION &&
            hasAddresses &&
            model.coupon === COUPON_CODES.BUNDLE &&
            !isVisionary && (
                <div key="upsell-5" className="no-mobile flex flex-nowrap flex-align-items-center pl1 pr1">
                    <TickIcon />
                    <span className="flex-item-fluid">
                        {c('Info').t`You are saving an extra 20% with the bundle discount`}
                    </span>
                </div>
            ),
        step === SUBSCRIPTION_STEPS.PAYMENT && onlyVPN && (
            <div key="upsell-6" className="no-mobile flex flex-nowrap flex-align-items-center pl1 pr1">
                <ClockIcon />
                <span className="flex-item-fluid">{c('Info').t`30-days money back guaranteed`}</span>
            </div>
        ),
        step === SUBSCRIPTION_STEPS.PAYMENT && protectedPayment && (
            <div key="upsell-7" className="no-mobile flex flex-nowrap flex-align-items-center pl1 pr1">
                <ShieldIcon />
                <span className="flex-item-fluid">
                    {c('Info').t`Payments are protected with TLS encryption and Swiss privacy laws`}
                </span>
            </div>
        ),
    ].filter(Boolean);

    return (
        <>
            <Button onClick={onClose} className="flex-item-noshrink">
                {cancel}
            </Button>
            {upsells}
            {submit}
        </>
    );
};

NewSubscriptionModalFooter.propTypes = {
    plans: PropTypes.array.isRequired,
    submit: PropTypes.node.isRequired,
    onClose: PropTypes.func.isRequired,
    step: PropTypes.number,
    model: PropTypes.object,
    method: PropTypes.string,
};

export default NewSubscriptionModalFooter;
