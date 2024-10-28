import BlackFridayFooter from '../../components/blackFriday/BlackFridayFooter';
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
                <BlackFridayFooter {...props} />
            </OfferFooter>
        </OfferLayoutBF>
    ) : (
        <OfferLoader />
    );
};

export default Layout;
