import { c } from 'ttag';

import { getDealDuration } from '../../helpers/offerCopies';
import { useDealContext } from '../shared/deal/DealContext';

const DealTitleBF2024 = () => {
    const {
        deal: { dealName, cycle, isLifeTime },
    } = useDealContext();

    const durationDeal = getDealDuration(cycle);

    return (
        <div className="offer-plan-namePeriod">
            <span className="offer-plan-name block text-4xl mt-1 mb-0">{dealName}</span>
            <span className="color-weak block">
                {isLifeTime
                    ? // translator: instead of saying below the plan the duration, this string is used in case of lifetime deal.
                      c('BF2024: Offers').t`forever`
                    : // translator: examples: For <1 month> or <1 year>
                      c('BF2024: Offers').jt`for ${durationDeal}`}
            </span>
        </div>
    );
};

export default DealTitleBF2024;
