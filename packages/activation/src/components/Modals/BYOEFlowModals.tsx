import { advanceToBYOESuccess, clearBYOEFlow } from '../../logic/byoeFlow/byoeFlow.slice';
import { useEasySwitchDispatch, useEasySwitchSelector } from '../../logic/store';
import { BYOEMoreStorageModal } from './BYOEMoreStorageModal/BYOEMoreStorageModal';
import { BYOESetupSuccessModal } from './BYOESetupSuccessModal/BYOESetupSuccessModal';

const BYOEFlowModals = () => {
    const dispatch = useEasySwitchDispatch();
    const { connectedAddress, stepModal, skipImport } = useEasySwitchSelector((state) => state.byoeFlow);

    if (stepModal === 'moreStorage') {
        return <BYOEMoreStorageModal open onComplete={() => dispatch(advanceToBYOESuccess())} />;
    }

    if (stepModal === 'success' && connectedAddress) {
        return (
            <BYOESetupSuccessModal
                open
                connectedAddress={connectedAddress}
                skipImport={skipImport}
                onClose={() => dispatch(clearBYOEFlow())}
            />
        );
    }

    return null;
};

export default BYOEFlowModals;
