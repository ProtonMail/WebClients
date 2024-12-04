import { useEffect } from 'react';

import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import { TelemetryMailPostSubscriptionEvents } from '@proton/shared/lib/api/telemetry';

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

    useEffect(() => {
        if (config) {
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

    return <config.modal modalProps={modalProps} step={step} />;
};

export default PostSubscriptionModal;
