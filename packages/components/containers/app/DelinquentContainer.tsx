import { useUser } from '../../hooks/useUser';
import DelinquentModal from '../api/DelinquentModal';

const DelinquentContainer = () => {
    const [user] = useUser();
    return (
        <div className="h-full ui-prominent">
            <DelinquentModal open delinquent={user.Delinquent} />
        </div>
    );
};

export default DelinquentContainer;
