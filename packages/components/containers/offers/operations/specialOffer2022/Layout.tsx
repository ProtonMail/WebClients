import { c } from 'ttag';

import { PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';

import OfferFooter from '../../components/shared/OfferFooter';
import OfferHeader from '../../components/shared/OfferHeader';
import OfferLoader from '../../components/shared/OfferLoader';
import ProtonLogos from '../../components/shared/ProtonLogos';
import Deals from '../../components/shared/deal/Deals';
import hasOffer from '../../helpers/hasOffer';
import { OfferLayoutProps } from '../../interface';

const Layout = (props: OfferLayoutProps) => {
    const planName = PLAN_NAMES[PLANS.BUNDLE];

    return (
        <>
            <ProtonLogos />
            {hasOffer(props) ? (
                <>
                    <OfferHeader {...props}>
                        <h1 className="h2 text-center text-bold">{c('specialoffer: Title')
                            .t`Save more with 1 year of ${planName}`}</h1>
                    </OfferHeader>

                    <Deals {...props} />

                    <OfferFooter {...props}>
                        <p className="text-sm text-center mb1 color-weak">{c('specialoffer: Footer')
                            .t`This subscription will automatically renew every year at the same rate until it is cancelled.`}</p>
                    </OfferFooter>
                </>
            ) : (
                <OfferLoader />
            )}
        </>
    );
};

export default Layout;
