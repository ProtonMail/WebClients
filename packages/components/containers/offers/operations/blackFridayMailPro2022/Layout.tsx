import { c } from 'ttag';

import BlackFridayLayout from '../../components/blackFriday/BlackFridayLayout';
import BlackFridayMailFooter from '../../components/blackFriday/BlackFridayMailFooter';
import OfferFooter from '../../components/shared/OfferFooter';
import OfferHeader from '../../components/shared/OfferHeader';
import OfferLoader from '../../components/shared/OfferLoader';
import OfferTitle from '../../components/shared/OfferTitle';
import Deals from '../../components/shared/deal/Deals';
import hasOffer from '../../helpers/hasOffer';
import { OfferLayoutProps } from '../../interface';

const Layout = (props: OfferLayoutProps) => {
    return hasOffer(props) ? (
        <BlackFridayLayout {...props}>
            <OfferHeader {...props}>
                <OfferTitle>{c('specialoffer: Title')
                    .t`Our discontinued Visionary plan is back for a limited time only`}</OfferTitle>
            </OfferHeader>

            <Deals {...props} />

            <OfferFooter {...props}>
                <BlackFridayMailFooter {...props} />
            </OfferFooter>
        </BlackFridayLayout>
    ) : (
        <OfferLoader />
    );
};

export default Layout;
