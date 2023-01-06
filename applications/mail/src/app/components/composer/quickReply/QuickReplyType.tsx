import React, { MutableRefObject, useState } from 'react';

import { c } from 'ttag';

import { DropdownMenu, DropdownMenuButton, EditorActions, Icon, SimpleDropdown } from '@proton/components/components';
import { useAddresses } from '@proton/components/hooks';

import { MESSAGE_ACTIONS } from '../../../constants';
import { getRecipients, getReplyRecipientListAsString } from '../../../helpers/message/messageRecipients';
import { useContactsMap } from '../../../hooks/contact/useContacts';
import { MessageState } from '../../../logic/messages/messagesTypes';
import { MessageChange } from '../Composer';

const { REPLY, REPLY_ALL } = MESSAGE_ACTIONS;

interface Props {
    referenceMessage?: MessageState;
    modelMessage: MessageState;
    onChange: MessageChange;
    editorRef: MutableRefObject<EditorActions | undefined>;
}

const QuickReplyType = ({ referenceMessage, modelMessage, onChange, editorRef }: Props) => {
    const [addresses] = useAddresses();
    const contactEmailsMap = useContactsMap();
    const [replyType, setReplyType] = useState<MESSAGE_ACTIONS>(modelMessage.draftFlags?.action || REPLY);

    const handleChangeReplyType = (newReplyType: MESSAGE_ACTIONS) => {
        if (replyType === newReplyType || !referenceMessage) {
            return;
        }

        const { ToList, CCList, BCCList } = getRecipients(referenceMessage, newReplyType, addresses);

        onChange({ data: { ToList, CCList, BCCList } });

        setReplyType(newReplyType);

        editorRef?.current?.focus();
    };

    const recipientsAsString = referenceMessage
        ? getReplyRecipientListAsString(referenceMessage, replyType, addresses, contactEmailsMap)
        : '';

    /*
     * translator: The variable contains the recipients list of the quick reply
     * The list can contain the name of the contact of the address if the contact has no name
     * Full sentence for reference: "Quick reply to Michael Scott, dwight.schrutte@pm.me"
     */
    const replyToString = c('Info').t`Quick reply to ${recipientsAsString}`;

    const iconName = replyType === REPLY ? 'arrow-up-and-left-big' : 'arrows-up-and-left-big';

    return (
        <>
            <SimpleDropdown
                as="button"
                type="button"
                hasCaret
                className="navigation-link-header-group-control flex mr0-5"
                content={<Icon className="flex-item-noshrink mr-0-5" name={iconName} />}
                data-testid="quick-reply-type-dropdown"
            >
                <DropdownMenu>
                    <DropdownMenuButton
                        className="flex flex-align-items-center text-left"
                        onClick={() => handleChangeReplyType(REPLY)}
                        data-testid="quick-reply-type-dropdown-reply-button"
                    >
                        <Icon name="arrow-up-and-left-big" className="mr0-5" />
                        {c('Action').t`Reply`}
                    </DropdownMenuButton>
                    <DropdownMenuButton
                        className="flex flex-align-items-center text-left"
                        onClick={() => handleChangeReplyType(REPLY_ALL)}
                        data-testid="quick-reply-type-dropdown-reply-all-button"
                    >
                        <Icon name="arrows-up-and-left-big" className="mr0-5" />
                        {c('Action').t`Reply all`}
                    </DropdownMenuButton>
                </DropdownMenu>
            </SimpleDropdown>

            <div
                className="flex-item-fluid text-ellipsis"
                aria-level={2}
                role="heading"
                title={replyToString}
                data-testid="recipients-list-string"
            >
                {replyToString}
            </div>
        </>
    );
};

export default QuickReplyType;
