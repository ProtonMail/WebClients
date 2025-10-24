import { useEffect, useState } from 'react';

import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import clsx from '@proton/utils/clsx';

import { getDiscountWithCoupon } from '../../helpers/dealPrices';
import type { OfferProps } from '../../interface';
import DealFeatures from '../shared/deal/DealFeatures';
import DealGuarantee from '../shared/deal/DealGuarantee';
import DealMostPopular from '../shared/deal/DealMostPopular';
import DealPrice from '../shared/deal/DealPrice';
import DealPriceInfos from '../shared/deal/DealPriceInfos';
import DealBF2024 from './DealBF';
import DealCTABF2024 from './DealCTABF';
import DealSaveSentence from './DealSaveSentence';
import DealTitleBF2024 from './DealTitleBF';

const DealsBF = (props: OfferProps) => {
    const { deals, hideDealTitle, hideDealPriceInfos } = props.offer;

    const [isExpanded, setIsExpanded] = useState(true);
    const { viewportWidth } = useActiveBreakpoint();

    const numberDeals = deals.length;

    useEffect(() => {
        if (viewportWidth['<=small']) {
            setIsExpanded(false);
        }

        if (viewportWidth.xlarge && numberDeals > 3) {
            setIsExpanded(false);
        }
    }, [viewportWidth['<=small'], viewportWidth.xlarge]);

    return (
        <div
            className={clsx([
                'offer-wrapper gap-4 flex flex-nowrap flex-column md:flex-row',
                numberDeals === 1 ? 'mt-4 md:mt-8 mx-2 md:mx-4' : 'justify-center mt-11',
            ])}
        >
            {deals.map((deal) => {
                const discount = getDiscountWithCoupon(deal);

                return (
                    <DealBF2024 key={deal.ref} {...props} deal={deal}>
                        <div className="flex flex-row">
                            <div className="flex-1">{hideDealTitle ? null : <DealTitleBF2024 />}</div>
                            <div className={clsx([numberDeals > 1 && 'hidden', 'sm:flex ml-2'])}>
                                <DealMostPopular />
                                {numberDeals === 1 && (getDiscountWithCoupon(deal) || deal.bubbleText) ? (
                                    <span
                                        className={clsx([
                                            'text-semibold absolute font-super5 text-center offer-percentage offer-percentage--one-plan',
                                            deal.popular === 1 ? '' : 'color-weak border border-norm',
                                        ])}
                                    >
                                        {deal.bubbleText ? deal.bubbleText : `- ${discount}%`}
                                    </span>
                                ) : null}
                            </div>
                        </div>
                        <DealPrice />
                        <DealSaveSentence sentence={deal.sentence} sentenceSaveType={deal.sentenceSaveType} />
                        <DealCTABF2024 {...props} />
                        <DealGuarantee />
                        <div
                            className={clsx(
                                'offer-features flex-auto w-full',
                                !hideDealPriceInfos || (numberDeals === 1 && 'mb-4')
                            )}
                        >
                            <DealFeatures isExpanded={isExpanded} expand={() => setIsExpanded(true)} />
                        </div>
                        {hideDealPriceInfos ? null : <DealPriceInfos />}
                    </DealBF2024>
                );
            })}
        </div>
    );
};

export default DealsBF;
