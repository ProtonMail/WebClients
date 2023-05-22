import FamilyPlanFooter from '../../components/familyPlan/FamilyPlanFooter';
import FamilyPlanTitle from '../../components/familyPlan/FamilyPlanTitle';
import OfferFooter from '../../components/shared/OfferFooter';
import OfferHeader from '../../components/shared/OfferHeader';
import OfferLayout from '../../components/shared/OfferLayout';
import OfferLoader from '../../components/shared/OfferLoader';
import Deals from '../../components/shared/deal/Deals';
import hasOffer from '../../helpers/hasOffer';
import { OfferLayoutProps } from '../../interface';

const Layout = (props: OfferLayoutProps) =>
    hasOffer(props) ? (
        <OfferLayout {...props}>
            <OfferHeader {...props}>
                <FamilyPlanTitle />
            </OfferHeader>

            <Deals {...props} />

            <OfferFooter {...props}>
                <FamilyPlanFooter {...props} />
            </OfferFooter>
        </OfferLayout>
    ) : (
        <OfferLoader />
    );

export default Layout;
