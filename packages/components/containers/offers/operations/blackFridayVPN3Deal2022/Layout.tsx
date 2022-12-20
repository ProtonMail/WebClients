import { c } from 'ttag';

import BlackFridayFooter from '../../components/blackFriday/BlackFridayFooter';
import OfferFooter from '../../components/shared/OfferFooter';
import OfferHeader from '../../components/shared/OfferHeader';
import OfferLayout from '../../components/shared/OfferLayout';
import OfferLoader from '../../components/shared/OfferLoader';
import Deals from '../../components/shared/deal/Deals';
import hasOffer from '../../helpers/hasOffer';
import { OfferLayoutProps } from '../../interface';

const Layout = (props: OfferLayoutProps) => {
    return hasOffer(props) ? (
        <OfferLayout {...props}>
            <OfferHeader {...props}>
                <h1 className="h2 text-center text-bold">{c('specialoffer: Title').t`End of year offer`}</h1>
            </OfferHeader>

            <Deals {...props} />

            <OfferFooter {...props}>
                <BlackFridayFooter {...props} />
            </OfferFooter>
        </OfferLayout>
    ) : (
        <OfferLoader />
    );
};

export default Layout;
