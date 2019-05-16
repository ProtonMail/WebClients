import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Badge } from 'react-components';
import { COUPON_CODES } from 'proton-shared/lib/constants';

const { BUNDLE, BLACK_FRIDAY_2018, PMTEAM } = COUPON_CODES;

const CouponDiscountBadge = ({ code }) => {
    if (code === BUNDLE) {
        return (
            <Badge type="success" tooltip={c('Discount with coupon code').t`20% discount applied to your subscription`}>
                -20%
            </Badge>
        );
    }

    if (code === BLACK_FRIDAY_2018) {
        return (
            <Badge type="success" tooltip={c('Discount with coupon code').t`50% discount applied to your subscription`}>
                -50%
            </Badge>
        );
    }

    if (code === PMTEAM) {
        return <Badge type="success">-100%</Badge>;
    }

    return null;
};

CouponDiscountBadge.propTypes = {
    code: PropTypes.string
};

export default CouponDiscountBadge;
