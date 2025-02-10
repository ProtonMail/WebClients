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
        { name: c('Valentine_2025: Offer').t`Unlimited hide-my-email aliases` },
        { name: c('Valentine_2025: Offer').t`Integrated 2FA authenticator` },
        { name: c('Valentine_2025: Offer').t`Secure vault sharing` },
    ];

    return hasOffer(props) ? (
        <ValentineOfferLayout>
            <section className="flex flex-column *:min-size-auto flex-nowrap w-full px-2 py-12 valentine" {...props}>
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
