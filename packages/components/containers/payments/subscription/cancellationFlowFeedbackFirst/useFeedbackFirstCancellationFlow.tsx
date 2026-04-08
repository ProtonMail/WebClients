import useModalState from '@proton/components/components/modalTwo/useModalState';

import FeedbackFirstCancellation from './feedbackFirstCancellation';

const useFeedbackFirstCancellationFlow = () => {
    const [modalProps, setModalOpen, renderModal] = useModalState();

    const startFlow = () => {
        setModalOpen(true);
    };

    const modals = (
        <>
            {renderModal && (
                <FeedbackFirstCancellation {...modalProps} />
            )}
        </>
    );

    return {
        startFlow,
        modals,
    };
};

export default useFeedbackFirstCancellationFlow;
