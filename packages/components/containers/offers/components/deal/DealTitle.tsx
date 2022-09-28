import { PLAN_NAMES } from '@proton/shared/lib/constants';

import { getDealDuration } from './Deal.helpers';
import { useDealContext } from './DealContext';

const DealTitle = () => {
    const {
        deal: { planName, cycle },
    } = useDealContext();

    return (
        <div className="offer-plan-namePeriod">
            <strong className="offer-plan-name block text-center text-2xl mt0-5 mb0">{PLAN_NAMES[planName]}</strong>
            <span className="color-weak block text-center">{getDealDuration(cycle)}</span>
        </div>
    );
};

export default DealTitle;
