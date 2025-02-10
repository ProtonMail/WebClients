import { type ReactNode } from 'react';

import EllipsisLoader from '@proton/components/components/loader/EllipsisLoader';
import Price from '@proton/components/components/price/Price';
import { type CYCLE, type Currency, type PlanIDs } from '@proton/payments';
import { isLifetimePlanSelected } from '@proton/shared/lib/helpers/planIDs';

import { getMonthFreeText } from '../../../offers/helpers/offerCopies';
import PlanDiscount from '../helpers/PlanDiscount';
import PlanPrice from '../helpers/PlanPrice';

const CycleItemView = ({
    loading,
    currency,
    text,
    total,
    monthlySuffix,
    totalPerMonth,
    discount,
    freeMonths,
    cycle,
    planIDs,
    cyclePriceCompare,
}: {
    loading?: boolean;
    currency: Currency;
    text: ReactNode;
    total: number;
    monthlySuffix: string;
    totalPerMonth: number;
    discount: number;
    freeMonths: number;
    cycle: CYCLE;
    planIDs: PlanIDs;
    cyclePriceCompare?: ReactNode;
}) => {
    const isLifetimePlan = isLifetimePlanSelected(planIDs);

    const pricePerMonth = (
        <>
            <Price currency={currency} suffix={monthlySuffix} data-testid="price-value-per-user-per-month">
                {totalPerMonth}
            </Price>
            {cyclePriceCompare}
        </>
    );

    return (
        <div className="flex-1 pl-2">
            <div className="flex items-center">
                <div className="flex-auto mr-4">
                    <strong className="text-lg">{text}</strong>
                    {freeMonths > 0 && (
                        <span className="color-success">
                            {` + `}
                            {getMonthFreeText(freeMonths)}
                        </span>
                    )}
                </div>
                <PlanPrice loading={loading} total={total} currency={currency} />
            </div>
            {!isLifetimePlan && (
                <div className="flex items-center">
                    <span className="color-weak flex flex-auto" data-testid={`price-per-user-per-month-${cycle}`}>
                        {loading ? <EllipsisLoader /> : pricePerMonth}
                    </span>

                    <PlanDiscount loading={loading} discount={discount} currency={currency} />
                </div>
            )}
        </div>
    );
};

export default CycleItemView;
