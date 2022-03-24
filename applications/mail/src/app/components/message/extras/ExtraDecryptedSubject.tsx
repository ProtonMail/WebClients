import { Icon, Tooltip } from '@proton/components';
import { c } from 'ttag';
import { MessageState } from '../../../logic/messages/messagesTypes';

interface Props {
    message: MessageState;
}

const ExtraDecryptedSubject = ({ message }: Props) => {
    if (message.data?.Subject !== '...' || !message.decryption?.decryptedSubject) {
        return null;
    }

    return (
        <div className="bg-norm rounded border p0-5 mb0-85 flex flex-nowrap" data-testid="encrypted-subject-banner">
            <div className="flex">
                <Tooltip title={c('Info').t`Subject is end-to-end encrypted`}>
                    <Icon
                        name="lock"
                        className="mt0-5 mr0-5 ml0-2 flex-item-noshrink"
                        alt={c('Info').t`Subject is end-to-end encrypted`}
                    />
                </Tooltip>
                <div className="mr0-5 mt0-25 flex-item-fluid pb0-25">
                    {c('Info').t`Subject:`} {message.decryption?.decryptedSubject}
                </div>
            </div>
        </div>
    );
};

export default ExtraDecryptedSubject;
