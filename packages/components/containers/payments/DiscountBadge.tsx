import { ReactNode } from 'react';

import { c } from 'ttag';

import { getAppName } from '@proton/shared/lib/apps/helper';
import { APPS, BLACK_FRIDAY, COUPON_CODES } from '@proton/shared/lib/constants';

import { Badge } from '../../components';

const { BUNDLE, PROTONTEAM, BLACK_FRIDAY_2018, BLACK_FRIDAY_2019, BLACK_FRIDAY_2020 } = COUPON_CODES;
const vpnAppName = getAppName(APPS.PROTONVPN_SETTINGS);

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

    const vpnPlus = `${vpnAppName} Plus`;
    if (code === BLACK_FRIDAY.COUPON_CODE) {
        return (
            <Badge
                type="success"
                tooltip={c('blackfriday: VPNspecialoffer Badge popup')
                    .t`${vpnPlus} Special Offer 2021 discount has been applied`}
            >
                {c('blackfriday: VPNspecialoffer Promo title, need to be short').t`Special offer`}
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
