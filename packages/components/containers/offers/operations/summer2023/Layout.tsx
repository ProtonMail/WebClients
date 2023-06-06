import OfferFooter from '../../components/shared/OfferFooter';
import OfferHeader from '../../components/shared/OfferHeader';
import OfferLayout from '../../components/shared/OfferLayout';
import OfferLoader from '../../components/shared/OfferLoader';
import OfferTitle from '../../components/shared/OfferTitle';
import DealsWithCycleSelector from '../../components/shared/deal/DealsWithCycleSelector';
import hasOffer from '../../helpers/hasOffer';
import { OfferLayoutProps } from '../../interface';

const Layout = (props: OfferLayoutProps) => {
    return hasOffer(props) ? (
        <OfferLayout {...props}>
            <OfferHeader {...props}>
                <OfferTitle>TODO</OfferTitle>
            </OfferHeader>

            <DealsWithCycleSelector {...props} />

            <OfferFooter {...props}>TODO</OfferFooter>
        </OfferLayout>
    ) : (
        <OfferLoader />
    );
};

export default Layout;
