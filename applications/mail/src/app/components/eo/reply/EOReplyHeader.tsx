import { c } from 'ttag';

import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import RecipientItem from '../../message/recipients/RecipientItem';
import RecipientType from '../../message/recipients/RecipientType';

interface Props {
    message: MessageState;
}

const EOReplyHeader = ({ message }: Props) => {
    const subject = message.data?.Subject;

    return (
        <>
            <div className="flex items-center px-7 py-5">
                <h1 className="eo-layout-title text-ellipsis m-0 mb-2" title={subject}>
                    {subject}
                </h1>
            </div>
            <div className="message-header eo-message-header message-header-expanded is-outbound border-top border-bottom px-7 py-4">
                <RecipientType label={c('Label').t`From:`} className={clsx(['flex items-start flex-nowrap mb-3'])}>
                    <RecipientItem
                        recipientOrGroup={{ recipient: message.data?.EORecipient }}
                        isLoading={false}
                        isOutside
                        onContactDetails={noop}
                        onContactEdit={noop}
                    />
                </RecipientType>
                <RecipientType
                    label={c('Label').t`To:`}
                    className={clsx(['flex items-start flex-nowrap message-recipient-expanded'])}
                >
                    <RecipientItem
                        recipientOrGroup={{ recipient: message.data?.Sender }}
                        isLoading={false}
                        isOutside
                        onContactDetails={noop}
                        onContactEdit={noop}
                    />
                </RecipientType>
            </div>
        </>
    );
};

export default EOReplyHeader;
