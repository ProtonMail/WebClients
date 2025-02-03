import { c } from 'ttag';

import {
    BRAND_NAME,
    CALENDAR_APP_NAME,
    DARK_WEB_MONITORING_NAME,
    DRIVE_APP_NAME,
    MAIL_APP_NAME,
} from '@proton/shared/lib/constants';
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

export const ValentineBundleLayout = (props: OfferLayoutProps) => {
    const { offer, currency, onSelectDeal, onCloseModal } = props;
    const [deal] = offer?.deals || [];

    const features = [
        {
            name: c('Valentine_2025: Offer').t`500 GB total storage`,
            tooltip: c('Valentine_2025: Offer')
                .t`Storage space is shared across ${MAIL_APP_NAME}, ${CALENDAR_APP_NAME}, and ${DRIVE_APP_NAME}.`,
        },
        {
            name: c('Valentine_2025: Offer').t`All Mail, VPN, Pass, and Drive premium features`,
            tooltip: c('Valentine_2025: Offer').t`All premium ${BRAND_NAME} services. One easy subscription.`,
        },
        {
            name: c('Valentine_2025: Offer').t`Advanced account protection`,
            tooltip: c('Valentine_2025: Offer')
                .t`Offers top-tier account security and expert support. ${DARK_WEB_MONITORING_NAME} scans hidden parts of the internet for ${MAIL_APP_NAME} email addresses that have ended up in illegal data markets. If a breach is detected, you’ll get a Security Center alert with steps to protect your account.`,
        },
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
