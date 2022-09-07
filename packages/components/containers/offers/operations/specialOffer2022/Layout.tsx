import { c } from 'ttag';

import OfferFooter from '../../components/OfferFooter';
import OfferHeader from '../../components/OfferHeader';
import Deals from '../../components/deal/Deals';
import { OfferLayoutProps } from '../../interface';

const Layout = (props: OfferLayoutProps) => {
    return (
        <>
            <OfferHeader {...props}>
                <h1 className="h2 text-center text-bold">{c('specialoffer: Title')
                    .t`Save more with 1 year of Proton Unlimited`}</h1>
            </OfferHeader>

            <Deals {...props} />

            <OfferFooter {...props}>
                <p className="text-sm text-center mb1 color-weak">{c('specialoffer: Footer')
                    .t`This subscription will automatically renew every year at the same rate until it is cancelled.`}</p>
            </OfferFooter>
        </>
    );
};

export default Layout;
