import OfferFooter from '../../components/shared/OfferFooter';
import OfferHeader from '../../components/shared/OfferHeader';
import OfferLayout from '../../components/shared/OfferLayout';
import OfferLoader from '../../components/shared/OfferLoader';
import OfferTitle from '../../components/shared/OfferTitle';
import Deals from '../../components/shared/deal/Deals';
import hasOffer from '../../helpers/hasOffer';
import { OfferLayoutProps } from '../../interface';
import { getExpires, getRenews, getTitle } from './text';

const Layout = (props: OfferLayoutProps) => {
    const { currency } = props;

    return hasOffer(props) ? (
        <OfferLayout {...props}>
            <OfferHeader {...props}>
                <OfferTitle>{getTitle(currency)}</OfferTitle>
                <p className="text-center">{getExpires()}</p>
            </OfferHeader>

            <Deals {...props} />

            <OfferFooter {...props}>
                <p className="text-sm text-center mb-4 color-weak">{getRenews(currency)}</p>
            </OfferFooter>
        </OfferLayout>
    ) : (
        <OfferLoader />
    );
};

export default Layout;
