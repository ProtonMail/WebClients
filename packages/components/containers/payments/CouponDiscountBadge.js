import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Badge } from 'react-components';
import { COUPON_CODES, BLACK_FRIDAY } from 'proton-shared/lib/constants';

const { BUNDLE, PMTEAM } = COUPON_CODES;

const CouponDiscountBadge = ({ code }) => {
    if (code === BUNDLE) {
        return (
            <Badge type="success" tooltip={c('Discount with coupon code').t`20% discount applied to your subscription`}>
                -20%
            </Badge>
        );
    }

    if (code === BLACK_FRIDAY.COUPON_CODE) {
        return (
            <Badge
                type="success"
                tooltip={c('Discount with coupon code').t`Black Friday 2019 newcomer discount has been applied`}
            >
                Black Friday
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
