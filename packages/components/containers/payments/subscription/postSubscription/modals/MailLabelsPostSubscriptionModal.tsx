import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/index';
import EditLabelModal from '@proton/components/containers/labels/modals/EditLabelModal';
import illustration from '@proton/styles/assets/img/illustrations/check.svg';

import { SUBSCRIPTION_STEPS } from '../../constants';
import type { PostSubscriptionModalComponentProps } from '../interface';
import {
    PostSubscriptionModalContentWrapper,
    PostSubscriptionModalHeader,
    PostSubscriptionModalLoadingContent,
    PostSubscriptionModalWrapper,
} from './PostSubscriptionModalsComponents';

interface ConfirmationModalContentProps extends PostSubscriptionModalComponentProps {
    onDisplayLabels: () => void;
}
const ConfirmationModalContent = ({ onDisplayLabels, onRemindMeLater }: ConfirmationModalContentProps) => {
    return (
        <>
            <PostSubscriptionModalHeader illustration={illustration} />
            <PostSubscriptionModalContentWrapper>
                <h1 className="text-lg text-bold text-center mb-0">{c('Title').t`Upgrade complete!`}</h1>
                <h2 className="text-lg text-center mt-0 mb-6">{c('Title')
                    .t`You can now create unlimited folders and labels`}</h2>
                <div>
                    <Button color="norm" fullWidth onClick={onDisplayLabels}>
                        {c('Button').t`Create label`}
                    </Button>
                    <p className="my-4 text-center color-weak text-sm">{c('Info').t`or discover other features:`}</p>
                    <Button fullWidth onClick={onRemindMeLater}>{c('Button').t`Take a tour`}</Button>
                </div>
            </PostSubscriptionModalContentWrapper>
        </>
    );
};

const MailLabelsPostSubscriptionModal = (props: PostSubscriptionModalComponentProps) => {
    const { modalProps, step, onRemindMeLater } = props;
    const [displayLabelsModal, setDisplayLabelsModal] = useState(false);

    if (displayLabelsModal) {
        return (
            <EditLabelModal
                {...modalProps}
                // Handles all modal close events (save, cancel, keyboard, click outside)
                onClose={onRemindMeLater}
                type={'label'}
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
                <ConfirmationModalContent
                    {...props}
                    onDisplayLabels={() => {
                        setDisplayLabelsModal(true);
                    }}
                />
            )}
        </PostSubscriptionModalWrapper>
    );
};

export default MailLabelsPostSubscriptionModal;
