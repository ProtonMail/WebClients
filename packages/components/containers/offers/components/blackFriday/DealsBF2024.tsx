import { useEffect, useState } from 'react';

import { c } from 'ttag';

import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import clsx from '@proton/utils/clsx';

import { getDiscountWithCoupon } from '../../helpers/dealPrices';
import type { OfferProps } from '../../interface';
import DealFeatures from '../shared/deal/DealFeatures';
import DealGuarantee from '../shared/deal/DealGuarantee';
import DealMostPopular from '../shared/deal/DealMostPopular';
import DealPrice from '../shared/deal/DealPrice';
import DealPriceInfos from '../shared/deal/DealPriceInfos';
import DealBF2024 from './DealBF2024';
import DealCTABF2024 from './DealCTABF2024';
import DealTitleBF2024 from './DealTitleBF2024';

const DealsBF2024 = (props: OfferProps) => {
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
                'offer-wrapper gap-4 flex flex-nowrap justify-center flex-column md:flex-row',
                numberDeals === 1 ? 'mt-4 md:mt-11' : 'mt-11',
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
                                            'text-semibold absolute text-center offer-percentage offer-percentage--one-plan text-ellipsis py-1 px-4',
                                            deal.popular === 1 ? 'bg-primary' : 'bg-weak color-weak border border-norm',
                                        ])}
                                        title={
                                            deal.bubbleText
                                                ? deal.bubbleText
                                                : c('specialoffer: Offers').t`Save ${discount}%`
                                        }
                                    >
                                        {deal.bubbleText
                                            ? deal.bubbleText
                                            : c('specialoffer: Offers').t`Save ${discount}%`}
                                    </span>
                                ) : null}
                            </div>
                        </div>
                        <DealPrice />
                        <DealCTABF2024 />
                        <DealGuarantee />
                        <div className={clsx('offer-features flex-auto w-full', !hideDealPriceInfos && 'mb-4')}>
                            <DealFeatures isExpanded={isExpanded} expand={() => setIsExpanded(true)} />
                        </div>
                        {hideDealPriceInfos ? null : <DealPriceInfos />}
                    </DealBF2024>
                );
            })}
        </div>
    );
};

export default DealsBF2024;
