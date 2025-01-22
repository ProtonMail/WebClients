import { featureTourActions } from '@proton/account/featuresTour';
import { remindMeLaterAboutFeatureTourAction } from '@proton/account/featuresTour/actions';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import { usePostSubscriptionTourTelemetry } from '@proton/components/hooks/mail/usePostSubscriptionTourTelemetry';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { TelemetryPostSubscriptionTourEvents } from '@proton/shared/lib/api/telemetry';
import { wait } from '@proton/shared/lib/helpers/promise';

import type { SubscriptionOverridableStep } from '../SubscriptionModalProvider';
import type { PostSubscriptionFlowName } from './interface';
import postSubscriptionConfig from './postSubscriptionConfig';

interface PostSubscriptionModalProps extends ModalStateProps {
    name: PostSubscriptionFlowName;
    step: SubscriptionOverridableStep;
    upsellRef?: string;
}

const PostSubscriptionModal = ({ name, step, upsellRef, ...modalProps }: PostSubscriptionModalProps) => {
    const config = name ? postSubscriptionConfig[name] : null;
    const dispatch = useDispatch();
    const postSubscriptionTourTelemetry = usePostSubscriptionTourTelemetry();

    if (!config) {
        return null;
    }

    const handleDisplayFeatureTour = async () => {
        modalProps.onClose();

        void postSubscriptionTourTelemetry({
            event: TelemetryPostSubscriptionTourEvents.post_subscription_action,
            dimensions: {
                flow: name,
                postSubscriptionAction: 'startFeatureTour',
                upsellRef,
            },
        });

        // Let post subscription modal close animation happen
        await wait(150);

        // Then display feature tour modal
        dispatch(featureTourActions.display({ steps: config.featureTourSteps, origin: 'postSubscription' }));
    };

    const handleRemindMeLater = () => {
        modalProps.onClose();

        void postSubscriptionTourTelemetry({
            event: TelemetryPostSubscriptionTourEvents.post_subscription_action,
            dimensions: {
                postSubscriptionAction: 'remindMeLater',
                flow: name,
                upsellRef,
            },
        });

        void dispatch(remindMeLaterAboutFeatureTourAction());
    };

    const handleClose = () => {
        modalProps.onClose();
        void postSubscriptionTourTelemetry({
            event: TelemetryPostSubscriptionTourEvents.post_subscription_action,
            dimensions: {
                postSubscriptionAction: 'closeModal',
                flow: name,
                upsellRef,
            },
        });
    };

    return (
        <config.modal
            modalProps={{
                ...modalProps,
                onClose: handleClose,
            }}
            onDisplayFeatureTour={handleDisplayFeatureTour}
            onRemindMeLater={handleRemindMeLater}
            step={step}
            upsellRef={upsellRef}
            flowName={name}
        />
    );
};

export default PostSubscriptionModal;
