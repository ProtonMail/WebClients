import DelinquentModal from '../api/DelinquentModal';

const DelinquentContainer = () => {
    return (
        <div className="h100 ui-prominent bg-norm">
            <DelinquentModal open />
        </div>
    );
};

export default DelinquentContainer;
