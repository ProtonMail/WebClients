import { c } from 'ttag';

import { Price } from '@proton/components/components';
import { PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';

import OfferFooter from '../../components/shared/OfferFooter';
import OfferHeader from '../../components/shared/OfferHeader';
import OfferLayout from '../../components/shared/OfferLayout';
import OfferLoader from '../../components/shared/OfferLoader';
import OfferTitle from '../../components/shared/OfferTitle';
import Deals from '../../components/shared/deal/Deals';
import hasOffer from '../../helpers/hasOffer';
import { OfferLayoutProps } from '../../interface';

const Layout = (props: OfferLayoutProps) => {
    const { currency } = props;
    const planName = PLAN_NAMES[PLANS.MAIL];
    const planPrice = (
        <Price key="plan-price" currency={currency} isDisplayedInSentence>
            {100}
        </Price>
    );
    const renewablePrice = (
        <Price key="renewable-price" currency={currency} suffix={c('Suffix').t`/month`} isDisplayedInSentence>
            {499}
        </Price>
    );
    return hasOffer(props) ? (
        <OfferLayout {...props}>
            <OfferHeader {...props}>
                <OfferTitle>{c('mailtrial2024: Title').jt`Get ${planName} for only ${planPrice}`}</OfferTitle>
                <p className="text-center">{c('mailtrial2024: Info').t`Limited-time offer, expires April 2 2024`}</p>
            </OfferHeader>

            <Deals {...props} />

            <OfferFooter {...props}>
                <p className="text-sm text-center mb-4 color-weak">{c('mailtrial2024: Footer')
                    .jt`Renews at ${renewablePrice}, cancel anytime`}</p>
            </OfferFooter>
        </OfferLayout>
    ) : (
        <OfferLoader />
    );
};

export default Layout;
