import { ReactNode } from 'react';

import { c } from 'ttag';

import { COUPON_CODES } from '@proton/shared/lib/constants';

import { Badge } from '../../components';

const {
    BUNDLE,
    PROTONTEAM,
    BLACK_FRIDAY_2018,
    BLACK_FRIDAY_2019,
    BLACK_FRIDAY_2020,
    BLACK_FRIDAY_2022,
    MAIL_BLACK_FRIDAY_2022,
    VPN_BLACK_FRIDAY_2022,
} = COUPON_CODES;

interface Props {
    code: string;
    description?: string;
    children: ReactNode;
}

const DiscountBadge = ({ code, description, children }: Props) => {
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

    if (code === BLACK_FRIDAY_2020) {
        return (
            <Badge type="success" tooltip={c('Info').t`Black Friday 2020 newcomer discount has been applied`}>
                Black Friday
            </Badge>
        );
    }

    if (code === BLACK_FRIDAY_2022 || code === MAIL_BLACK_FRIDAY_2022 || code === VPN_BLACK_FRIDAY_2022) {
        return (
            <Badge type="success" tooltip={c('Info').t`Black Friday 2022 applied to your subscription`}>
                Black Friday
            </Badge>
        );
    }

    if (code === PROTONTEAM) {
        return <Badge type="success">-100%</Badge>;
    }

    return (
        <Badge
            type="success"
            tooltip={description || c('Info').t`Discount applied to your subscription with coupon ${code}`}
        >
            {children}
        </Badge>
    );
};

export default DiscountBadge;
