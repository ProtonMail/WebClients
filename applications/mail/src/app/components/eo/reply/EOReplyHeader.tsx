import { c } from 'ttag';
import { classnames } from '@proton/components';
import { MessageState } from '../../../logic/messages/messagesTypes';
import RecipientItem from '../../message/recipients/RecipientItem';
import RecipientType from '../../message/recipients/RecipientType';

interface Props {
    message: MessageState;
}

const EOReplyHeader = ({ message }: Props) => {
    const subject = message.data?.Subject;

    return (
        <>
            <div className="flex flex-align-items-center mb1">
                <h1 className="text-ellipsis m0" title={subject}>
                    {subject}
                </h1>
            </div>
            <RecipientType
                label={c('Label').t`From:`}
                className={classnames([
                    'flex flex-align-items-start flex-nowrap mb0-5',
                    //! messageLoaded && 'flex-item-fluid',
                ])}
            >
                <RecipientItem
                    recipientOrGroup={{ recipient: message.data?.EORecipient }}
                    isLoading={false}
                    isOutside
                />
            </RecipientType>
            <RecipientType
                label={c('Label').t`To:`}
                className={classnames([
                    'flex flex-align-items-start flex-nowrap',
                    //! messageLoaded && 'flex-item-fluid',
                ])}
            >
                <RecipientItem recipientOrGroup={{ recipient: message.data?.Sender }} isLoading={false} isOutside />
            </RecipientType>
        </>
    );
};

export default EOReplyHeader;
