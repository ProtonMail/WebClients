import { useEffect } from 'react';

import { featureTourActions } from '@proton/account/featuresTour';
import { remindMeLaterAboutFeatureTourAction } from '@proton/account/featuresTour/actions';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { TelemetryMailPostSubscriptionEvents } from '@proton/shared/lib/api/telemetry';
import { wait } from '@proton/shared/lib/helpers/promise';

import type { SubscriptionOverridableStep } from '../SubscriptionModalProvider';
import type { PostSubscriptionFlowName } from './interface';
import postSubscriptionConfig from './postSubscriptionConfig';
import { usePostSubscriptionTelemetry } from './usePostSubscriptionTelemetry';

interface PostSubscriptionModalProps extends ModalStateProps {
    name: PostSubscriptionFlowName;
    step: SubscriptionOverridableStep;
}

const PostSubscriptionModal = ({ name, step, ...modalProps }: PostSubscriptionModalProps) => {
    const config = name ? postSubscriptionConfig[name] : null;
    const sendTelemetryEvent = usePostSubscriptionTelemetry();
    const dispatch = useDispatch();

    useEffect(() => {
        if (config) {
            // TODO: TELEMETRY: Check if this event is still relevant
            void sendTelemetryEvent({
                event: TelemetryMailPostSubscriptionEvents.post_subscription_start,
                dimensions: {
                    modal: name,
                },
            });
        }
    }, []);

    if (!config) {
        return null;
    }

    const handleDisplayFeatureTour = async () => {
        modalProps.onClose();

        // Let post subscription modal close animation happen
        await wait(150);

        // Then display feature tour modal
        dispatch(featureTourActions.display({ steps: config.featureTourSteps }));
    };

    const handleRemindMeLater = () => {
        modalProps.onClose();
        void dispatch(remindMeLaterAboutFeatureTourAction());
    };

    return (
        <config.modal
            modalProps={modalProps}
            onDisplayFeatureTour={handleDisplayFeatureTour}
            onRemindMeLater={handleRemindMeLater}
            step={step}
        />
    );
};

export default PostSubscriptionModal;
