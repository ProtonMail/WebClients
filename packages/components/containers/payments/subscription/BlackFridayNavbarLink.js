import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
    useUser,
    useApi,
    useLoading,
    useBlackFriday,
    TopNavbarLink,
    SubscriptionModal,
    usePlans,
    useSubscription,
    useModals
} from 'react-components';

import { checkLastCancelledSubscription } from './helpers';

const BlackFridayNavbarLink = ({ to, location, getModal, ...rest }) => {
    const [plans, loadingPlans] = usePlans();
    const [subscription, loadingSubscription] = useSubscription();
    const { createModal } = useModals();
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const [user] = useUser();
    const isBlackFriday = useBlackFriday();
    const [isEligible, setEligibility] = useState(false);
    const icon = 'blackfriday';
    const text = 'Black Friday';

    const onSelect = ({ planIDs = [], cycle, currency, couponCode }) => {
        const plansMap = planIDs.reduce((acc, planID) => {
            const { Name } = plans.find(({ ID }) => ID === planID);
            acc[Name] = 1;
            return acc;
        }, Object.create(null));

        createModal(
            <SubscriptionModal
                plansMap={plansMap}
                customize={false}
                subscription={subscription}
                cycle={cycle}
                currency={currency}
                coupon={couponCode}
            />
        );
    };

    const handleClick = () => {
        if (location.pathname === to) {
            createModal(getModal({ plans, onSelect }));
        }
    };

    useEffect(() => {
        if (user.isFree && isBlackFriday) {
            withLoading(checkLastCancelledSubscription(api).then(setEligibility));
        }
    }, [isBlackFriday, user.isFree]);

    if (!isBlackFriday || !isEligible || user.isPaid || loading || loadingPlans || loadingSubscription) {
        return null;
    }

    return (
        <TopNavbarLink
            to={to}
            aria-current={location.pathname === to}
            icon={icon}
            text={text}
            onClick={handleClick}
            {...rest}
        />
    );
};

BlackFridayNavbarLink.propTypes = {
    to: PropTypes.string.isRequired,
    location: PropTypes.object.isRequired,
    getModal: PropTypes.func.isRequired
};

export default BlackFridayNavbarLink;
