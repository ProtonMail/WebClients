import { c } from 'ttag';

import { classnames } from '@proton/components';
import noop from '@proton/utils/noop';

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
            <div className="flex flex-align-items-center px2 py1-5 on-tiny-mobile-pl0 on-tiny-mobile-pr0">
                <h1 className="eo-layout-title text-ellipsis m0" title={subject}>
                    {subject}
                </h1>
            </div>
            <div className="message-header eo-message-header message-header-expanded is-outbound border-top border-bottom px2 py1 on-tiny-mobile-pl0 on-tiny-mobile-pr0">
                <RecipientType
                    label={c('Label').t`From:`}
                    className={classnames(['flex flex-align-items-start flex-nowrap mb0-85'])}
                >
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
                    className={classnames(['flex flex-align-items-start flex-nowrap message-recipient-expanded'])}
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
