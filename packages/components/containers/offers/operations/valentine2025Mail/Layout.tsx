import { c } from 'ttag';

import { isElectronMail } from '@proton/shared/lib/helpers/desktop';

import OfferLoader from '../../components/shared/OfferLoader';
import {
    ValentineCTA,
    ValentineFeatureList,
    ValentineFooter,
    ValentineHeader,
    ValentinePartnerCoupon,
    ValentinePricing,
} from '../../components/valentine/ValentineComponents';
import { ValentineOfferLayout } from '../../components/valentine/ValentineLayout25';
import hasOffer from '../../helpers/hasOffer';
import type { OfferLayoutProps } from '../../interface';

const Layout = (props: OfferLayoutProps) => {
    const { offer, currency, onSelectDeal, onCloseModal } = props;
    const [deal] = offer?.deals || [];

    const features = [
        { name: c('Valentine_2025: Offer').t`15 GB storage` },
        { name: c('Valentine_2025: Offer').t`Use your own email domain` },
        { name: c('Valentine_2025: Offer').t`10 email addresses for you` },
    ];

    return hasOffer(props) ? (
        <ValentineOfferLayout>
            <section className="flex flex-column flex-nowrap w-full px-2 py-12 valentine" {...props}>
                <ValentineHeader salePercentage="50" />
                <ValentinePricing deal={deal} currency={currency} />
                <ValentinePartnerCoupon dealName={deal.dealName} salePercentage="50" />
                <ValentineCTA
                    onClick={() => {
                        if (offer && deal) {
                            onSelectDeal(offer, deal, currency);

                            if (isElectronMail) {
                                onCloseModal();
                            }
                        }
                    }}
                />
                <ValentineFeatureList features={features} />
                <ValentineFooter />
            </section>
        </ValentineOfferLayout>
    ) : (
        <OfferLoader />
    );
};

export default Layout;
