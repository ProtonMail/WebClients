import { useState } from 'react';

import { c } from 'ttag';

import CycleSelector from '@proton/components/containers/payments/CycleSelector';
import { CYCLE } from '@proton/shared/lib/constants';

import type { OfferProps } from '../../../interface';
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
            <div className="text-center">
                <CycleSelector
                    mode="buttons"
                    cycle={cycle}
                    onSelect={setCycle}
                    options={[
                        { text: c('summer2023: Billing cycle option').t`1 year`, value: CYCLE.YEARLY },
                        { text: c('summer2023: Billing cycle option').t`2 years`, value: CYCLE.TWO_YEARS },
                    ]}
                />
            </div>
            <div className="offer-wrapper gap-4 flex flex-nowrap justify-center flex-column md:flex-row mt-11">
                {filteredDeals.map((deal) => (
                    <Deal key={deal.ref} {...props} deal={deal}>
                        <DealMostPopular />
                        <DealTitle />
                        <DealPrice />
                        <DealCTA />
                        <div className="offer-features flex-auto w-full mb-4">
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
