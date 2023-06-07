import { useState } from 'react';

import { c } from 'ttag';

import { CycleSelector } from '@proton/components/containers/payments';
import { CYCLE } from '@proton/shared/lib/constants';

import { OfferProps } from '../../../interface';
import Deal from './Deal';
import DealCTA from './DealCTA';
import DealFeatures from './DealFeatures';
import DealMostPopular from './DealMostPopular';
import DealPrice from './DealPrice';
import DealPriceInfos from './DealPriceInfos';
import DealTitle from './DealTitle';

const DealsWithCycleSelector = (props: OfferProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [cycle, setCycle] = useState(CYCLE.TWO_YEARS);
    const filteredDeals = props.offer.deals.filter((deal) => deal.cycle === cycle);

    if (!filteredDeals.length) {
        return null;
    }

    return (
        <>
            <CycleSelector
                mode="buttons"
                cycle={cycle}
                onSelect={setCycle}
                options={[
                    { text: c('Billing cycle option').t`12 months`, value: CYCLE.YEARLY },
                    { text: c('Billing cycle option').t`24 months`, value: CYCLE.TWO_YEARS },
                ]}
            />
            <div className="offer-wrapper flex flex-nowrap flex-justify-space-around on-mobile-flex-column mt-11">
                {filteredDeals.map((deal) => (
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
        </>
    );
};

export default DealsWithCycleSelector;
