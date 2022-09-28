import { forwardRef } from 'react';

import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

import type { Offer, OfferLayoutProps } from '../../interface';
import { DealProvider } from './DealContext';

interface Props extends OfferLayoutProps {
    deal: Offer['deals'][number];
    children: React.ReactNode;
}

const Deal = forwardRef<HTMLDivElement, Props>(({ children, ...props }: Props, ref) => {
    const { popular, prices, cycle } = props.deal;

    const { withCoupon = 0, withoutCouponMonthly = 0 } = prices || {};
    const withCouponMonthly = withCoupon / cycle;
    const percentage = 100 - Math.round((withCouponMonthly * 100) / withoutCouponMonthly);

    return (
        <DealProvider {...props}>
            <div
                ref={ref}
                className={clsx([
                    'relative flex flex-item-fluid offer-plan-container on-mobile-mt1',
                    popular && 'offer-plan-container--mostPopular',
                ])}
            >
                {percentage ? (
                    <span
                        className={clsx([
                            'text-semibold absolute text-center offer-percentage py0-25 px1',
                            popular ? 'bg-primary' : 'bg-weak color-weak border border-norm',
                        ])}
                    >
                        {c('specialoffer: Offers').jt`Save ${percentage}%`}
                    </span>
                ) : null}
                <div
                    className={clsx([
                        'offer-plan w100 border rounded p1 mb1 flex flex-column flex-align-items-center flex-justify-end',
                        popular && 'border-primary is-focused',
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
