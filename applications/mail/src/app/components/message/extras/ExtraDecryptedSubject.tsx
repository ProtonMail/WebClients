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
        <div
            className="bg-norm rounded border p0-5 mb0-5 flex flex-nowrap flex-align-items-center flex-justify-space-between"
            data-testid="encrypted-subject-banner"
        >
            <div className="flex">
                <Tooltip title={c('Info').t`Subject is end-to-end encrypted`}>
                    <Icon
                        name="lock-filled"
                        className="mtauto mbauto mr0-5"
                        alt={c('Info').t`Subject is end-to-end encrypted`}
                    />
                </Tooltip>
                <div className="mr0-5">
                    {c('Info').t`Subject:`} {message.decryption?.decryptedSubject}
                </div>
            </div>
        </div>
    );
};

export default ExtraDecryptedSubject;
