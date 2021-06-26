import React from 'react';
import { c } from 'ttag';
import { COUPON_CODES, BLACK_FRIDAY } from '@proton/shared/lib/constants';

import { Badge } from '../../components';

const { BUNDLE, PROTONTEAM, BLACK_FRIDAY_2018, BLACK_FRIDAY_2019 } = COUPON_CODES;

interface Props {
    code: string;
}

const DiscountBadge = ({ code }: Props) => {
    if (code === BUNDLE) {
        return (
            <Badge type="success" tooltip={c('Info').t`20% discount applied to your subscription with coupon ${code}`}>
                -20%
            </Badge>
        );
    }

    if (code === BLACK_FRIDAY_2018) {
        return (
            <Badge type="success" tooltip={c('Info').t`Black Friday 2018 applied to your subscription`}>
                Black Friday
            </Badge>
        );
    }

    if (code === BLACK_FRIDAY_2019) {
        return (
            <Badge type="success" tooltip={c('Info').t`Black Friday 2019 applied to your subscription`}>
                Black Friday
            </Badge>
        );
    }

    if (code === BLACK_FRIDAY.COUPON_CODE) {
        return (
            <Badge type="success" tooltip={c('Info').t`Black Friday 2020 newcomer discount has been applied`}>
                Black Friday
            </Badge>
        );
    }

    if (code === PROTONTEAM) {
        return <Badge type="success">-100%</Badge>;
    }

    return (
        <Badge type="success" tooltip={c('Info').t`Discount applied to your subscription with coupon ${code}`}>
            {code}
        </Badge>
    );
};

export default DiscountBadge;
