import { ReactNode, forwardRef } from 'react';

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
    const { popular } = props.deal;
    const discount = getDiscountWithCoupon(props.deal);
    const isMostPopular = popular === 1;
    const isSecondMostPopular = popular === 2;
    const isThirdMostPopular = popular === 3;

    return (
        <DealProvider {...props}>
            <div
                ref={ref}
                className={clsx([
                    'relative flex flex-item-fluid offer-plan-container mt-4 md:mt-0',
                    isMostPopular && 'offer-plan-container--mostPopular',
                    isSecondMostPopular && 'offer-plan-container--secondMostPopular',
                    isThirdMostPopular && 'offer-plan-container--thirdMostPopular',
                ])}
            >
                {discount ? (
                    <span
                        className={clsx([
                            'text-semibold absolute text-center offer-percentage py-1 px-4',
                            isMostPopular ? 'bg-primary' : 'bg-weak color-weak border border-norm',
                        ])}
                    >
                        {c('specialoffer: Offers').t`Save ${discount}%`}
                    </span>
                ) : null}
                <div
                    className={clsx([
                        'offer-plan w100 border rounded p-4 mb-4 flex flex-column flex-align-items-center flex-justify-end',
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
