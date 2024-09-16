import type { Dispatch, KeyboardEvent, SetStateAction } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';
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
        ? getReplyRecipientListAsString(referenceMessage, MESSAGE_ACTIONS.REPLY, addresses || [], contactEmailsMap)
        : '';

    /*
     * translator: The variable contains the recipients list of the quick reply
     * The list can contain the name of the contact of the address if the contact has no name
     * Full sentence for reference: "Quick reply to Michael Scott, dwight.schrutte@pm.me"
     */
    const replyToString = isReferenceMessageInitialized
        ? c('loc_nightly_Info').t`Quick reply to ${recipientsAsString}`
        : c('loc_nightly_Info').t`Quick reply`;

    return (
        <div className="quick-reply-wrapper bg-norm color-norm pt-3 pb-4">
            {!newMessageID ? (
                <div className="flex flex-nowrap items-center border border-weak rounded-lg color-weak mx-4 px-2 py-1 cursor-pointer quick-reply-collapsed relative">
                    <Icon className="mr-2 shrink-0" name="arrow-up-and-left-big" aria-hidden="true" />
                    <button
                        type="button"
                        className="flex-1 text-ellipsis text-left expand-click-area"
                        onClick={handleEdit}
                        disabled={!isReferenceMessageInitialized}
                        onKeyDown={handleOpenFromKeydown}
                        tabIndex={0}
                        data-testid="quick-reply-container-button"
                    >
                        {replyToString}
                    </button>
                    <Button
                        className="shrink-0"
                        aria-hidden="true"
                        color="weak"
                        shape="outline"
                        size="small"
                        icon
                        disabled
                    >
                        <Icon name="paper-plane" alt={c('loc_nightly_action').t`Send quick reply`} />
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
