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
        { name: c('Valentine_2025: Offer').t`10,000+ servers in 110+ countries` },
        { name: c('Valentine_2025: Offer').t`Protect 10 devices at a time` },
        {
            name: c('Valentine_2025: Offer').t`High-speed streaming`,
            tooltip: c('Valentine_2025: Offer')
                .t`Access content on streaming services, including Netflix, Disney+, Prime Video, and more, from anywhere.`,
        },
    ];

    return hasOffer(props) ? (
        <ValentineOfferLayout>
            <section className="flex flex-column *:min-size-auto flex-nowrap w-full px-2 py-12 valentine" {...props}>
                <ValentineHeader salePercentage="60" />
                <ValentinePricing deal={deal} currency={currency} />
                <ValentinePartnerCoupon dealName={deal.dealName} salePercentage="60" />
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
