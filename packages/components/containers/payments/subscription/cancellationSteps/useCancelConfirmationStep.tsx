import { useSubscription } from '@proton/account/subscription/hooks';
import { useModalTwoPromise } from '@proton/components/components/modalTwo/useModalTwo';

import { CancelSubscriptionModal } from '../cancelSubscription/CancelSubscriptionModal';
import type { CancelSubscriptionResult } from '../cancelSubscription/types';
import type { CancellationStep, CancellationStepConfig } from './types';

export const useCancelConfirmationStep = ({
    canShow,
}: CancellationStepConfig): CancellationStep<CancelSubscriptionResult> => {
    const [subscription] = useSubscription();
    const [cancelSubscriptionModal, showCancelSubscriptionModal] = useModalTwoPromise<
        undefined,
        CancelSubscriptionResult
    >();

    const modal = subscription
        ? cancelSubscriptionModal((props) => {
              return <CancelSubscriptionModal subscription={subscription} {...props} />;
          })
        : null;

    const show = async () => {
        if (!(await canShow())) {
            return { status: 'kept' as const };
        }

        return showCancelSubscriptionModal();
    };

    return { modal, show };
};
