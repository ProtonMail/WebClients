import hasOffer from '../../helpers/hasOffer';
import type { OfferLayoutProps } from '../../interface';
import OfferFooter from '../shared/OfferFooter';
import OfferLoader from '../shared/OfferLoader';
import BlackFridayFooter from './BlackFridayFooter';
import DealsBF from './DealsBF';
import OfferLayoutBF from './OfferLayoutBF';

const Layout = (props: OfferLayoutProps) => {
    return hasOffer(props) ? (
        <OfferLayoutBF {...props}>
            <DealsBF {...props} />

            <OfferFooter {...props}>
                <BlackFridayFooter {...props} />
            </OfferFooter>
        </OfferLayoutBF>
    ) : (
        <OfferLoader />
    );
};

export default Layout;
