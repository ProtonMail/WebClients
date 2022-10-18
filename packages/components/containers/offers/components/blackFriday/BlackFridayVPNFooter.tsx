import { c } from 'ttag';

import { OfferProps } from '../../interface';

const BlackFridayVPNFooter = ({ offer }: OfferProps) => {
    const dealWithStar = offer.deals.find((deal) => deal.star);
    return (
        <div className="mb1">
            <p className="text-sm text-center color-weak">{c('specialOffer: Footer')
                .t`Discounts are based on the standard monthly pricing.`}</p>

            {dealWithStar ? (
                <p className="text-sm text-center color-weak mb1">
                    <sup>{dealWithStar.star}</sup>
                    {c('specialoffer: Label')
                        .t`Your subscription will automatically renew at the standard rate at the end of your billing cycle`}
                </p>
            ) : null}
        </div>
    );
};

export default BlackFridayVPNFooter;
