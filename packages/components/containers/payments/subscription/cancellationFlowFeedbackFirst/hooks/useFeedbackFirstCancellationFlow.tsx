import { useSubscription } from '@proton/account/subscription/hooks';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { PLAN_NAMES, getPlanName, getPlanTitle } from '@proton/payments';

import { CancelRedirectionModal } from '../../cancellationFlow/CancelRedirectionModal';
import { FeedbackFirstCancellation } from '../FeedbackFirstCancellation';

export const useFeedbackFirstCancellationFlow = () => {
    const [modalProps, setModalOpen, renderModal] = useModalState();
    const [redirectModalProps, setRedirectModalOpen, redirectRenderModal] = useModalState();
    const [subscription] = useSubscription();

    const plan = getPlanName(subscription);
    const planDisplayName = plan ? PLAN_NAMES[plan] : (getPlanTitle(subscription) ?? '');

    const startFlow = () => {
        setModalOpen(true);
    };

    const modals = (
        <>
            {renderModal && (
                <FeedbackFirstCancellation
                    {...modalProps}
                    onCancelled={() => {
                        setRedirectModalOpen(true);
                    }}
                />
            )}
            {redirectRenderModal && plan && (
                <CancelRedirectionModal {...redirectModalProps} plan={plan} planName={planDisplayName} />
            )}
        </>
    );

    return {
        startFlow,
        modals,
    };
};
