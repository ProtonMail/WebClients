import { c } from 'ttag';

import type { OfferProps } from '../../interface';
import OfferDisableButton from '../shared/OfferDisableButton';

const Anniversary2025Footer = (props: OfferProps) => {
    return (
        <>
            <p className="color-weak text-sm mt-0 mb-2 text-center">{c('anniversary_2025: Offer')
                .t`Discounts are based on standard monthly pricing. At the end of the billing cycle, your subscription will renew at the standard annual rate.`}</p>
            {props.offer.canBeDisabled ? (
                <div className="pb-4 text-center">
                    <OfferDisableButton {...props} />
                </div>
            ) : null}
        </>
    );
};

export default Anniversary2025Footer;
