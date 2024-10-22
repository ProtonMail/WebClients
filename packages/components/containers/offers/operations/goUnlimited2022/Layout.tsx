import { c } from 'ttag';

import { PLANS, PLAN_NAMES } from '@proton/payments';

import OfferFooter from '../../components/shared/OfferFooter';
import OfferHeader from '../../components/shared/OfferHeader';
import OfferLayout from '../../components/shared/OfferLayout';
import OfferLoader from '../../components/shared/OfferLoader';
import OfferTitle from '../../components/shared/OfferTitle';
import Deals from '../../components/shared/deal/Deals';
import hasOffer from '../../helpers/hasOffer';
import type { OfferLayoutProps } from '../../interface';

const Layout = (props: OfferLayoutProps) => {
    const planName = PLAN_NAMES[PLANS.BUNDLE];

    return hasOffer(props) ? (
        <OfferLayout {...props}>
            <OfferHeader {...props}>
                <OfferTitle>{c('specialoffer: Title').t`Upgrade and save more with 2 years of ${planName}`}</OfferTitle>
            </OfferHeader>

            <Deals {...props} />

            <OfferFooter {...props}>
                <p className="text-sm text-center mb-4 color-weak">{c('specialoffer: Footer')
                    .t`This subscription will automatically renew every 2 years at the same rate until it is canceled.`}</p>
            </OfferFooter>
        </OfferLayout>
    ) : (
        <OfferLoader />
    );
};

export default Layout;
