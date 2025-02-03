import OfferLoader from '../../components/shared/OfferLoader';
import { ValentineBundleLayout } from '../../components/valentine/ValentineBundleLayout';
import hasOffer from '../../helpers/hasOffer';
import type { OfferLayoutProps } from '../../interface';

const Layout = (props: OfferLayoutProps) => {
    return hasOffer(props) ? <ValentineBundleLayout {...props} /> : <OfferLoader />;
};

export default Layout;
