import { PLAN_NAMES } from '@proton/payments/core/constants';
import { getPlanName, getPlanTitle } from '@proton/payments/core/subscription/helpers';
import type { Subscription } from '@proton/payments/core/subscription/interface';

import useModalState from '../../../../../components/modalTwo/useModalState';
import { CancelRedirectionModal } from '../../cancellationFlow/CancelRedirectionModal';
import { FeedbackFirstCancellation } from '../FeedbackFirstCancellation';

export const useFeedbackFirstCancellationFlow = (subscription: Subscription) => {
    const [modalProps, setModalOpen, renderModal] = useModalState();
    const [redirectModalProps, setRedirectModalOpen, redirectRenderModal] = useModalState();

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
                    subscription={subscription}
                    onCancelled={() => {
                        setRedirectModalOpen(true);
                    }}
                />
            )}
            {redirectRenderModal && plan && (
                <CancelRedirectionModal
                    {...redirectModalProps}
                    subscription={subscription}
                    plan={plan}
                    planName={planDisplayName}
                />
            )}
        </>
    );

    return {
        startFlow,
        modals,
    };
};
