import { useEffect, useState } from 'react';

import { useActiveBreakpoint } from '@proton/components/hooks';

import { OfferProps } from '../../../interface';
import Deal from './Deal';
import DealCTA from './DealCTA';
import DealFeatures from './DealFeatures';
import DealGuarantee from './DealGuarantee';
import DealMostPopular from './DealMostPopular';
import DealPrice from './DealPrice';
import DealPriceInfos from './DealPriceInfos';
import DealTitle from './DealTitle';

const Deals = (props: OfferProps) => {
    const { deals } = props.offer;
    const [isExpanded, setIsExpanded] = useState(true);
    const { viewportWidth } = useActiveBreakpoint();

    useEffect(() => {
        if (viewportWidth['<=small']) {
            setIsExpanded(false);
        }

        if (viewportWidth.xlarge && deals.length > 3) {
            setIsExpanded(false);
        }
    }, [viewportWidth['<=small'], viewportWidth.xlarge]);

    return (
        <div className="offer-wrapper gap-4 flex flex-nowrap justify-center flex-column md:flex-row mt-11">
            {deals.map((deal) => (
                <Deal key={deal.ref} {...props} deal={deal}>
                    <DealMostPopular />
                    <DealTitle />
                    <DealPrice />
                    <DealCTA />
                    <DealGuarantee />
                    <div className="offer-features flex-auto w-full mb-4">
                        <DealFeatures isExpanded={isExpanded} expand={() => setIsExpanded(true)} />
                    </div>
                    <DealPriceInfos />
                </Deal>
            ))}
        </div>
    );
};

export default Deals;
