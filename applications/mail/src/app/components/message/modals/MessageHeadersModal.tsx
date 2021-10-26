import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { FormModal } from '@proton/components';
import { c } from 'ttag';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';

interface Props {
    message?: Message;
    onClose?: () => void;
}

const MessageHeadersModal = ({ message, onClose, ...rest }: Props) => {
    const content = `${message?.Header}\n\r${message?.Body}`;

    const handleDownload = () => {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        downloadFile(blob, 'pgp.txt');
    };

    return (
        <FormModal
            title={c('Info').t`Message headers`}
            submit={c('Action').t`Download`}
            onSubmit={handleDownload}
            onClose={onClose}
            {...rest}
        >
            <pre className="text-break">{content}</pre>
        </FormModal>
    );
};

export default MessageHeadersModal;
