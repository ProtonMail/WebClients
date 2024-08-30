import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalProps, ModalStateProps } from '@proton/components';
import { Prompt } from '@proton/components';

interface Props extends ModalProps {
    modalProps: ModalStateProps;
    onResumeDownload: () => void;
}
const ResumeDownloadingModal = ({ onResumeDownload, modalProps }: Props) => {
    const { onClose } = modalProps;

    const handleResumeDownloading = () => {
        onResumeDownload();
        // TODO should we call init again?
        onClose?.();
    };

    /* translator:
     * Full string for reference: The Writing assistant needs to be fully downloaded before it can be used.
     */
    const modalText = c('Info').t`The writing assistant needs to finish downloading before it can be used.`;

    return (
        <Prompt
            title={c('Header').t`Resume downloading`}
            buttons={[
                <Button color="norm" onClick={handleResumeDownloading}>{c('Action').t`Resume downloading`}</Button>,
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...modalProps}
        >
            <span>{modalText}</span>
        </Prompt>
    );
};

export default ResumeDownloadingModal;
