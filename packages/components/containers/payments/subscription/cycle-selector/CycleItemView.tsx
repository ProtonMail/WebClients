import EllipsisLoader from '@proton/components/components/loader/EllipsisLoader';
import Price from '@proton/components/components/price/Price';
import type { CYCLE } from '@proton/shared/lib/constants';
import type { Currency } from '@proton/shared/lib/interfaces';

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
}: {
    loading?: boolean;
    currency: Currency;
    text: string;
    total: number;
    monthlySuffix: string;
    totalPerMonth: number;
    discount: number;
    freeMonths: number;
    cycle: CYCLE;
}) => {
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
            <div className="flex items-center">
                <span className="color-weak flex flex-auto" data-testid={`price-per-user-per-month-${cycle}`}>
                    {loading ? (
                        <EllipsisLoader />
                    ) : (
                        <Price currency={currency} suffix={monthlySuffix} data-testid="price-value-per-user-per-month">
                            {totalPerMonth}
                        </Price>
                    )}
                </span>
                <PlanDiscount loading={loading} discount={discount} currency={currency} />
            </div>
        </div>
    );
};

export default CycleItemView;
