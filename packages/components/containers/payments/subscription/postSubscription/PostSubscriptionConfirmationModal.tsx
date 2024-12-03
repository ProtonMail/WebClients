import { useEffect } from 'react';

import ModalTwo from '@proton/components/components/modalTwo/Modal';
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

    return (
        <ModalTwo {...modalProps} className="modal-two--twocolors">
            <config.modal onClose={modalProps.onClose} step={step} />
        </ModalTwo>
    );
};

export default PostSubscriptionModal;
