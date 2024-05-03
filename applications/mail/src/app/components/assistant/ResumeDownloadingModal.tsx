import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ModalProps, Prompt } from '@proton/components';
import { ASSISTANT_FEATURE_NAME } from '@proton/llm/lib';

interface Props extends ModalProps {
    onResumeDownload: () => void;
}
const ResumeDownloadingModal = ({ onResumeDownload, ...rest }: Props) => {
    const { onClose } = rest;

    const handleResumeDownloading = () => {
        onResumeDownload();
        // TODO should we call init again?
        onClose?.();
    };

    /* translator:
     * Full string for reference: The AI Assistant needs to be fully downloaded before it can be used.
     */
    const modalText = c('loc_nightly_assistant')
        .t`The ${ASSISTANT_FEATURE_NAME} needs to be fully downloaded before it can be used.`;

    return (
        <Prompt
            title={c('loc_nightly_assistant').t`Resume downloading`}
            buttons={[
                <Button color="norm" onClick={handleResumeDownloading}>{c('loc_nightly_assistant')
                    .t`Resume downloading`}</Button>,
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            <span>{modalText}</span>
        </Prompt>
    );
};

export default ResumeDownloadingModal;
