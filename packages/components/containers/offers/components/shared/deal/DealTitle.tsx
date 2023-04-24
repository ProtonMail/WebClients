import { PLAN_NAMES } from '@proton/shared/lib/constants';

import { getDealDuration } from '../../../helpers/offerCopies';
import { useDealContext } from './DealContext';

const DealTitle = () => {
    const {
        deal: { planName, cycle },
    } = useDealContext();

    return (
        <div className="offer-plan-namePeriod">
            <strong className="offer-plan-name block text-center text-2xl mt-1 mb-0">{PLAN_NAMES[planName]}</strong>
            <span className="color-weak block text-center">{getDealDuration(cycle)}</span>
        </div>
    );
};

export default DealTitle;
