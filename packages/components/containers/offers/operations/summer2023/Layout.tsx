import { c } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';

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
                <OfferTitle>{c('summer2023:Offer title').t`${BRAND_NAME} Anniversary Sale`}</OfferTitle>
                <p className="text-center mb-0">{c('summer2023:Info')
                    .t`We’re celebrating the nine-year anniversary of our crowdfunding!`}</p>
                <p className="text-center mt-0">{c('summer2023:Info')
                    .t`For a limited time, get the best ${BRAND_NAME} has to offer at an exclusive discount.`}</p>
            </OfferHeader>

            <DealsWithCycleSelector {...props} />

            <OfferFooter {...props}>
                <div className="mb-4">
                    <p className="text-sm text-center color-weak">
                        {c('summer2023:Footer')
                            .t`Discounts are based on the standard monthly pricing. This offer is only available to first-time subscribers.`}
                        <br />
                        {c('summer2023:Footer')
                            .t`*Your subscription will automatically renew at the standard discounted rate at the end of your billing cycle.`}
                    </p>
                </div>
            </OfferFooter>
        </OfferLayout>
    ) : (
        <OfferLoader />
    );
};

export default Layout;
