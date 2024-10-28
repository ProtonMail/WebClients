import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

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
            <span className={clsx(['color-weak block', isLifeTime && 'visibility-hidden'])}>
                {
                    // translator: examples: For <1 month> or <1 year>
                    c('BF2024: Offers').jt`for ${durationDeal}`
                }
            </span>
        </div>
    );
};

export default DealTitleBF2024;
