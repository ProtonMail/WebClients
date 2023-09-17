import { useEffect, useState } from 'react';

import { useActiveBreakpoint } from '@proton/components/hooks';

import { OfferProps } from '../../../interface';
import Deal from './Deal';
import DealCTA from './DealCTA';
import DealFeatures from './DealFeatures';
import DealMostPopular from './DealMostPopular';
import DealPrice from './DealPrice';
import DealPriceInfos from './DealPriceInfos';
import DealTitle from './DealTitle';

const Deals = (props: OfferProps) => {
    const { deals } = props.offer;
    const [isExpanded, setIsExpanded] = useState(true);
    const { isNarrow, isMediumDesktop } = useActiveBreakpoint();

    useEffect(() => {
        if (isNarrow) {
            setIsExpanded(false);
        }

        if (isMediumDesktop && deals.length > 3) {
            setIsExpanded(false);
        }
    }, [isNarrow, isMediumDesktop]);

    return (
        <div className="offer-wrapper gap-4 flex flex-nowrap flex-justify-center on-mobile-flex-column mt-11">
            {deals.map((deal) => (
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
