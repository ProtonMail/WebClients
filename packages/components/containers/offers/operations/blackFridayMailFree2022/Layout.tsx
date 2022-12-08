import BlackFridayFooter from '../../components/blackFriday/BlackFridayFooter';
import BlackFridayLayout from '../../components/blackFriday/BlackFridayLayout';
import BlackFridayTitle from '../../components/blackFriday/BlackFridayTitle';
import OfferFooter from '../../components/shared/OfferFooter';
import OfferHeader from '../../components/shared/OfferHeader';
import OfferLoader from '../../components/shared/OfferLoader';
import Deals from '../../components/shared/deal/Deals';
import hasOffer from '../../helpers/hasOffer';
import { OfferLayoutProps } from '../../interface';

const Layout = (props: OfferLayoutProps) => {
    return hasOffer(props) ? (
        <BlackFridayLayout {...props}>
            <OfferHeader {...props}>
                <BlackFridayTitle />
            </OfferHeader>

            <Deals {...props} />

            <OfferFooter {...props}>
                <BlackFridayFooter {...props} />
            </OfferFooter>
        </BlackFridayLayout>
    ) : (
        <OfferLoader />
    );
};

export default Layout;
