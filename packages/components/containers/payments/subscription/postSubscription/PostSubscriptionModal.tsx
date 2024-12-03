import { useEffect } from 'react';

import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import { TelemetryMailPostSubscriptionEvents } from '@proton/shared/lib/api/telemetry';

import type { SUBSCRIPTION_STEPS } from '../constants';
import type { PostSubscriptionFlowName } from './interface';
import postSubscriptionConfig from './postSubscriptionConfig';
import { usePostSubscriptionTelemetry } from './usePostSubscriptionTelemetry';

interface PostSubscriptionModalProps extends ModalStateProps {
    name: PostSubscriptionFlowName;
    step: SUBSCRIPTION_STEPS;
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
