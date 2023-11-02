import DelinquentModal from '../api/DelinquentModal';

const DelinquentContainer = () => {
    return (
        <div className="h-full ui-prominent">
            <DelinquentModal open />
        </div>
    );
};

export default DelinquentContainer;
