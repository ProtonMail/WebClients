import { c } from 'ttag';

import { PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import DealsBF2024 from '../../components/blackFriday/DealsBF2024';
import OfferLayoutBF from '../../components/blackFriday/OfferLayoutBF2024';
import OfferFooter from '../../components/shared/OfferFooter';
import OfferLoader from '../../components/shared/OfferLoader';
import hasOffer from '../../helpers/hasOffer';
import type { OfferLayoutProps } from '../../interface';

const Layout = (props: OfferLayoutProps) => {
    return hasOffer(props) ? (
        <OfferLayoutBF {...props}>
            <DealsBF2024 {...props} />

            <OfferFooter {...props}>
                <p className="text-sm text-center color-weak">
                    <div>{c('BF2024: Footer').t`Discounts are based on standard monthly pricing.`}</div>
                    <div>{c('BF2024: Footer')
                        .t`If you purchase Pass Family or Unlimited, your subscription will automatically renew at the standard discounted rate and duration at the end of your billing cycle.`}</div>
                    <div>{c('BF2024: Footer')
                        .t`${PASS_SHORT_APP_NAME} Plus lifetime deal has no renewal price, it’s a one-time payment for lifetime access to Pass Plus.`}</div>
                </p>
            </OfferFooter>
        </OfferLayoutBF>
    ) : (
        <OfferLoader />
    );
};

export default Layout;
