import clsx from '@proton/utils/clsx';

import type { OfferProps } from '../../interface';

const BlackFridayFooter = ({ offer }: OfferProps) => {
    const numberDeals = offer.deals.length;
    return (
        <div className="mb-4">
            {offer.deals.map((deal) => {
                const { cycle, dealName, star, renew: renewDescription } = deal;

                if (!renewDescription) {
                    return null;
                }

                const key = `${dealName}-${cycle}`;

                return (
                    <p
                        key={key}
                        className={clsx(
                            'text-sm text-center offer-renew-footer text-wrap-balance',
                            numberDeals > 1 && 'offer-renew-footer--multiple'
                        )}
                    >
                        {numberDeals > 1 && star && <sup className="mr-2">{star}</sup>}
                        {renewDescription}
                    </p>
                );
            })}
        </div>
    );
};

export default BlackFridayFooter;
