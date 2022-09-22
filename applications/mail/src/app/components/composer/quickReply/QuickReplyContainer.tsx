import { Dispatch, KeyboardEvent, SetStateAction, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components/components';
import { useAddresses } from '@proton/components/hooks';

import { MESSAGE_ACTIONS } from '../../../constants';
import { getReplyRecipientListAsString } from '../../../helpers/message/messageRecipients';
import { useContactsMap } from '../../../hooks/contact/useContacts';
import { useMessage } from '../../../hooks/message/useMessage';
import { useDraft } from '../../../hooks/useDraft';
import QuickReply from './QuickReply';

import './QuickReply.scss';

interface Props {
    referenceMessageID: string;
    conversationID?: string;
    conversationIndex?: number;
    onOpenQuickReply?: (index?: number) => void;
    onFocus: () => void;
    hasFocus: boolean;
    setHasFocus: Dispatch<SetStateAction<boolean>>;
}

const QuickReplyContainer = ({
    referenceMessageID,
    conversationID,
    conversationIndex,
    onOpenQuickReply,
    onFocus,
    hasFocus,
    setHasFocus,
}: Props) => {
    const [addresses] = useAddresses();
    const contactEmailsMap = useContactsMap();

    const { createDraft } = useDraft();
    const [newMessageID, setNewMessageID] = useState<string>();

    const { message: referenceMessage } = useMessage(referenceMessageID);

    const isReferenceMessageInitialized = referenceMessage?.messageDocument?.initialized;

    const handleEdit = async () => {
        const newMessageID = await createDraft(MESSAGE_ACTIONS.REPLY, referenceMessage, true);
        setNewMessageID(newMessageID);
        onOpenQuickReply?.(conversationIndex);
    };

    const handleCloseQuickReply = () => {
        setNewMessageID(undefined);
    };

    const handleOpenFromKeydown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            void handleEdit();
        }
    };

    const recipientsAsString = referenceMessage
        ? getReplyRecipientListAsString(referenceMessage, MESSAGE_ACTIONS.REPLY, addresses, contactEmailsMap)
        : '';

    /*
     * translator: The variable contains the recipients list of the quick reply
     * The list can contain the name of the contact of the address if the contact has no name
     * Full sentence for reference: "Quick reply to Michael Scott, dwight.schrutte@pm.me"
     */
    const replyToString = isReferenceMessageInitialized
        ? c('Info').t`Quick reply to ${recipientsAsString}`
        : c('Info').t`Quick reply`;

    return (
        <div className="quick-reply-wrapper bg-norm color-norm pt0-75 pb1">
            {!newMessageID ? (
                <div className="flex flex-nowrap flex-align-items-center border border-weak rounded-lg color-weak mx1 px0-5 py0-25 cursor-pointer quick-reply-collapsed relative">
                    <Icon className="mr0-5 flex-item-noshrink" name="arrow-up-and-left-big" aria-hidden="true" />
                    <button
                        type="button"
                        className="flex-item-fluid text-ellipsis text-left increase-click-surface"
                        onClick={handleEdit}
                        disabled={!isReferenceMessageInitialized}
                        onKeyDown={handleOpenFromKeydown}
                        tabIndex={0}
                    >
                        {replyToString}
                    </button>
                    <Button
                        className="flex-item-noshrink"
                        aria-hidden="true"
                        color="weak"
                        shape="outline"
                        size="small"
                        icon
                        disabled
                    >
                        <Icon name="paper-plane" alt={c('action').t`Send quick reply`} />
                    </Button>
                </div>
            ) : (
                <QuickReply
                    newMessageID={newMessageID}
                    referenceMessage={referenceMessage}
                    onCloseQuickReply={handleCloseQuickReply}
                    conversationID={conversationID}
                    onFocus={onFocus}
                    hasFocus={hasFocus}
                    setHasFocus={setHasFocus}
                />
            )}
        </div>
    );
};

export default QuickReplyContainer;
