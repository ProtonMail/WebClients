import hasOffer from '../../helpers/hasOffer';
import type { OfferLayoutProps } from '../../interface';
import OfferLoader from '../shared/OfferLoader';
import Anniversary2025CTA from './Anniversary2025CTA';
import Anniversary2025FeatureList from './Anniversary2025FeatureList';
import Anniversary2025Footer from './Anniversary2025Footer';
import Anniversary2025Header from './Anniversary2025Header';
import Anniversary2025Pricing from './Anniversary2025Pricing';

import './Anniversary2025Layout.scss';

const Anniversary2025Layout = (props: OfferLayoutProps) => {
    return hasOffer(props) ? (
        <section className="flex flex-column flex-nowrap *:min-size-auto w-full px-2 py-12 anniversary2025">
            <Anniversary2025Header {...props} />
            <Anniversary2025Pricing {...props} />
            <Anniversary2025CTA {...props} />
            <Anniversary2025FeatureList {...props} />
            <Anniversary2025Footer {...props} />
        </section>
    ) : (
        <OfferLoader />
    );
};

export default Anniversary2025Layout;
