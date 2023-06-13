import { useState } from 'react';

import { OfferProps } from '../../../interface';
import Deal from './Deal';
import DealCTA from './DealCTA';
import DealFeatures from './DealFeatures';
import DealMostPopular from './DealMostPopular';
import DealPrice from './DealPrice';
import DealPriceInfos from './DealPriceInfos';
import DealTitle from './DealTitle';

const Deals = (props: OfferProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    return (
        <div className="offer-wrapper gap-4 flex flex-nowrap flex-justify-center on-mobile-flex-column mt-11">
            {props.offer.deals.map((deal) => (
                <Deal key={deal.ref} {...props} deal={deal}>
                    <DealMostPopular />
                    <DealTitle />
                    <DealPrice />
                    <DealCTA />
                    <div className="offer-features flex-item-fluid-auto w100 mb-4">
                        <DealFeatures isExpanded={isExpanded} expand={() => setIsExpanded(true)} />
                    </div>
                    <DealPriceInfos />
                </Deal>
            ))}
        </div>
    );
};

export default Deals;
