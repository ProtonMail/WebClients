import { getDealDuration } from '../../../helpers/offerCopies';
import { useDealContext } from './DealContext';

const DealTitle = () => {
    const {
        deal: { dealName, cycle },
    } = useDealContext();

    return (
        <div className="offer-plan-namePeriod">
            <strong className="offer-plan-name block text-center text-2xl mt-1 mb-0">{dealName}</strong>
            <span className="color-weak block text-center">{getDealDuration(cycle)}</span>
        </div>
    );
};

export default DealTitle;
