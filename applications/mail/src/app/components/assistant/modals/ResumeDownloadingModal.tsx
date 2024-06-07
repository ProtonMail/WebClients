import { c } from 'ttag';

import { Button } from '@proton/atoms/index';
import { ModalProps, Prompt } from '@proton/components/index';

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
            {...rest}
        >
            <span>{modalText}</span>
        </Prompt>
    );
};

export default ResumeDownloadingModal;
