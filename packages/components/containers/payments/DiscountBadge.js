import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { COUPON_CODES, BLACK_FRIDAY } from 'proton-shared/lib/constants';

import { Badge } from '../../components';

const { BUNDLE, PMTEAM, BLACK_FRIDAY_2018 } = COUPON_CODES;

const DiscountBadge = ({ code }) => {
    if (code === BUNDLE) {
        return (
            <Badge type="success" tooltip={c('Info').t`20% discount applied to your subscription with coupon ${code}`}>
                -20%
            </Badge>
        );
    }

    if (code === BLACK_FRIDAY_2018) {
        return (
            <Badge type="info" tooltip={c('Info').t`Black Friday 2018 applied to your subscription`}>
                Black Friday
            </Badge>
        );
    }

    if (code === BLACK_FRIDAY.COUPON_CODE) {
        return (
            <Badge type="info" tooltip={c('Info').t`Black Friday 2019 newcomer discount has been applied`}>
                Black Friday
            </Badge>
        );
    }

    if (code === PMTEAM) {
        return <Badge type="success">-100%</Badge>;
    }

    return (
        <Badge type="success" tooltip={c('Info').t`Discount applied to your subscription with coupon ${code}`}>
            {code}
        </Badge>
    );
};

DiscountBadge.propTypes = {
    code: PropTypes.string,
};

export default DiscountBadge;
