import { useSubscription } from '@proton/account/subscription/hooks';
import { PLAN_NAMES } from '@proton/payments/core/constants';
import { getPlanName, getPlanTitle } from '@proton/payments/core/subscription/helpers';

import useModalState from '../../../../../components/modalTwo/useModalState';
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
