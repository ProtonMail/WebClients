import type { ReactNode } from 'react';
import { forwardRef } from 'react';

import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

import { getDiscountWithCoupon } from '../../../helpers/dealPrices';
import type { Offer, OfferProps } from '../../../interface';
import { DealProvider } from './DealContext';

interface Props extends OfferProps {
    deal: Offer['deals'][number];
    children: ReactNode;
}

const Deal = forwardRef<HTMLDivElement, Props>(({ children, ...props }: Props, ref) => {
    const { popular, mobileOrder, bubbleText } = props.deal;
    const hideDiscountBubble = props.offer?.hideDiscountBubble;
    const discount = getDiscountWithCoupon(props.deal);
    const isMostPopular = popular === 1;
    const isSecondMostPopular = popular === 2;
    const isThirdMostPopular = popular === 3;

    const isMostPopularOnMobile = mobileOrder === 1;
    const isSecondMostPopularOnMobile = mobileOrder === 2;
    const isThirdMostPopularOnMobile = mobileOrder === 3;
    const isFourthMostPopularOnMobile = mobileOrder === 4;

    return (
        <DealProvider {...props}>
            <div
                ref={ref}
                className={clsx([
                    'relative flex flex-1 offer-plan-container mt-4 md:mt-0',
                    isMostPopular && 'offer-plan-container--mostPopular',
                    isSecondMostPopular && 'offer-plan-container--secondMostPopular',
                    isThirdMostPopular && 'offer-plan-container--thirdMostPopular',
                    isMostPopularOnMobile && 'offer-plan-container--mostPopularOnMobile',
                    isSecondMostPopularOnMobile && 'offer-plan-container--secondMostPopularOnMobile',
                    isThirdMostPopularOnMobile && 'offer-plan-container--thirdMostPopularOnMobile',
                    isFourthMostPopularOnMobile && 'offer-plan-container--fourthMostPopularOnMobile',
                ])}
            >
                {(discount || bubbleText) && !hideDiscountBubble ? (
                    <span
                        className={clsx([
                            'text-semibold absolute text-center offer-percentage text-ellipsis py-1 px-4',
                            isMostPopular ? 'bg-primary' : 'bg-weak color-weak border border-norm',
                        ])}
                        title={bubbleText ? bubbleText : c('specialoffer: Offers').t`Save ${discount}%`}
                    >
                        {bubbleText ? bubbleText : c('specialoffer: Offers').t`Save ${discount}%`}
                    </span>
                ) : null}
                <div
                    className={clsx([
                        'offer-plan w-full border rounded p-4 mb-4 flex flex-column items-center justify-end',
                        isMostPopular && 'border-primary is-focused',
                    ])}
                >
                    {children}
                </div>
            </div>
        </DealProvider>
    );
});

Deal.displayName = 'Deal';

export default Deal;
