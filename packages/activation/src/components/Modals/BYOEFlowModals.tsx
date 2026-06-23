import { BYOEMoreStorageModal } from '@proton/activation/src/components/Modals/BYOEMoreStorageModal/BYOEMoreStorageModal';
import { BYOESetupSuccessModal } from '@proton/activation/src/components/Modals/BYOESetupSuccessModal/BYOESetupSuccessModal';
import { advanceToBYOESuccess, clearBYOEFlow } from '@proton/activation/src/logic/byoeFlow/byoeFlow.slice';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/src/logic/store';

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
