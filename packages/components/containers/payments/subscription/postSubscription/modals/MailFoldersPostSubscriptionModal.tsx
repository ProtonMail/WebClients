import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import EditLabelModal from '@proton/components/containers/labels/modals/EditLabelModal';
import { usePostSubscriptionTourTelemetry } from '@proton/components/hooks/mail/usePostSubscriptionTourTelemetry';
import { TelemetryPostSubscriptionTourEvents } from '@proton/shared/lib/api/telemetry';
import illustration from '@proton/styles/assets/img/illustrations/check.svg';

import { SUBSCRIPTION_STEPS } from '../../constants';
import type { PostSubscriptionModalComponentProps } from '../interface';
import {
    PostSubscriptionModalContentWrapper,
    PostSubscriptionModalHeader,
    PostSubscriptionModalLoadingContent,
    PostSubscriptionModalWrapper,
} from './PostSubscriptionModalsComponents';

const MailFoldersPostSubscriptionModal = ({
    modalProps,
    step,
    onRemindMeLater,
    flowName,
    upsellRef,
    onDisplayFeatureTour,
}: PostSubscriptionModalComponentProps) => {
    const [displayFoldersModal, setDisplayFoldersModal] = useState(false);

    const postSubscriptionTourTelemetry = usePostSubscriptionTourTelemetry();

    const handleCreateFolder = () => {
        void postSubscriptionTourTelemetry({
            event: TelemetryPostSubscriptionTourEvents.post_subscription_action,
            dimensions: {
                postSubscriptionAction: 'createFolder',
                flow: flowName,
                upsellRef: upsellRef,
            },
        });
        setDisplayFoldersModal(true);
    };

    if (displayFoldersModal) {
        return (
            <EditLabelModal
                {...modalProps}
                // Handles all modal close events (save, cancel, keyboard, click outside)
                onClose={onRemindMeLater}
                type={'folder'}
                mode="create"
                parentFolderId={undefined}
                onCloseCustomAction={undefined}
            />
        );
    }

    return (
        <PostSubscriptionModalWrapper {...modalProps} canClose={step === SUBSCRIPTION_STEPS.THANKS}>
            {step === SUBSCRIPTION_STEPS.UPGRADE ? (
                <PostSubscriptionModalLoadingContent title={c('Info').t`Registering your subscription…`} />
            ) : (
                <>
                    <PostSubscriptionModalHeader illustration={illustration} />
                    <PostSubscriptionModalContentWrapper
                        footer={
                            <>
                                <Button color="norm" fullWidth onClick={handleCreateFolder}>
                                    {c('Action').t`Create folder`}
                                </Button>
                                <p className="my-4 text-center color-weak text-sm">{
                                    // translator: complete sentence: <Action>create folder</Action> or discover other features: <Action>Take a tour</Action>
                                    c('Info').t`or discover other features:`
                                }</p>
                                <Button fullWidth onClick={onDisplayFeatureTour}>{c('Action').t`Take a tour`}</Button>
                            </>
                        }
                    >
                        <h1 className="text-lg text-bold text-center mb-0">{c('Title').t`Upgrade complete!`}</h1>
                        <h2 className="text-lg text-center mt-0 mb-6">{c('Title')
                            .t`You can now create unlimited folders and labels`}</h2>
                    </PostSubscriptionModalContentWrapper>
                </>
            )}
        </PostSubscriptionModalWrapper>
    );
};

export default MailFoldersPostSubscriptionModal;
