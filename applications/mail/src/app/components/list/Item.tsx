import React, { ChangeEvent, MouseEvent, DragEvent, useState } from 'react';
import { Location } from 'history';
import { classnames } from 'react-components';
import { getInitial } from 'proton-shared/lib/helpers/string';
import { MAILBOX_LABEL_IDS, VIEW_LAYOUT } from 'proton-shared/lib/constants';
import { Label } from 'proton-shared/lib/interfaces/Label';
import { ContactGroup } from 'proton-shared/lib/interfaces/ContactGroup';

import ItemCheckbox from './ItemCheckbox';
import { getRecipients as getMessageRecipients, getSender, getRecipients } from '../../helpers/message/messages';
import { getCurrentType, isUnread } from '../../helpers/elements';
import ItemColumnLayout from './ItemColumnLayout';
import ItemRowLayout from './ItemRowLayout';
import { Element } from '../../models/element';
import { ELEMENT_TYPES } from '../../constants';
import { getSenders } from '../../helpers/conversation';
import { getRecipientLabel, recipientsToRecipientOrGroup, getRecipientOrGroupLabel } from '../../helpers/addresses';
import { ContactEmail } from '../../models/contact';
import { isCustomLabel } from '../../helpers/labels';

const { SENT, ALL_SENT, DRAFTS, ALL_DRAFTS } = MAILBOX_LABEL_IDS;

interface Props {
    location: Location;
    labels?: Label[];
    labelID: string;
    elementID?: string;
    mailSettings: any;
    element: Element;
    checked?: boolean;
    contacts: ContactEmail[];
    contactGroups: ContactGroup[];
    onCheck: (event: ChangeEvent) => void;
    onClick: (element: Element) => void;
    onDragStart: (event: DragEvent) => void;
    onDragEnd: (event: DragEvent) => void;
}

const Item = ({
    location,
    labelID,
    labels,
    element,
    elementID,
    mailSettings = {},
    checked = false,
    contacts,
    contactGroups,
    onCheck,
    onClick,
    onDragStart,
    onDragEnd
}: Props) => {
    const [dragging, setDragging] = useState(false);

    const { ID = '' } = element;
    const displayRecipients = [SENT, ALL_SENT, DRAFTS, ALL_DRAFTS].includes(labelID as MAILBOX_LABEL_IDS);
    const type = getCurrentType({ mailSettings, labelID, location });
    const isConversation = type === ELEMENT_TYPES.CONVERSATION;
    const showIcon =
        labelID === MAILBOX_LABEL_IDS.ALL_MAIL ||
        labelID === MAILBOX_LABEL_IDS.STARRED ||
        isCustomLabel(labelID, labels);
    const senders = isConversation ? getSenders(element) : [getSender(element)];
    const recipients = isConversation ? getRecipients(element) : getMessageRecipients(element);
    const sendersLabels = senders.map(getRecipientLabel);
    const recipientsOrGroup = recipientsToRecipientOrGroup(recipients, contactGroups);
    const recipientsLabels = recipientsOrGroup.map((recipientOrGroup) =>
        getRecipientOrGroupLabel(recipientOrGroup, contacts)
    );

    const { ViewLayout = VIEW_LAYOUT.COLUMN } = mailSettings;
    const isColumnMode = ViewLayout === VIEW_LAYOUT.COLUMN;
    const ItemLayout = isColumnMode ? ItemColumnLayout : ItemRowLayout;
    const unread = isUnread(element);

    const handleClick = (event: MouseEvent<HTMLDivElement>) => {
        const target = event.target as HTMLElement;
        if (target.closest('.stop-propagation')) {
            event.stopPropagation();
            return;
        }
        onClick(element);
    };

    const handleDragStart = (event: DragEvent) => {
        setDragging(true);
        onDragStart(event);
    };

    const handleDragEnd = (event: DragEvent) => {
        setDragging(false);
        onDragEnd(event);
    };

    return (
        <div
            onClick={handleClick}
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            className={classnames([
                'flex flex-nowrap cursor-pointer',
                isColumnMode ? 'item-container' : 'item-container-row',
                elementID === ID && 'item-is-selected',
                !unread && 'read',
                dragging && 'item-dragging'
            ])}
        >
            <ItemCheckbox className="mr1 item-checkbox" checked={checked} onChange={onCheck}>
                {getInitial(displayRecipients ? recipientsLabels[0] : sendersLabels[0])}
            </ItemCheckbox>
            <ItemLayout
                labels={labels}
                element={element}
                mailSettings={mailSettings}
                type={type}
                showIcon={showIcon}
                senders={(displayRecipients ? recipientsLabels : sendersLabels).join(', ')}
                unread={unread}
            />
        </div>
    );
};

export default Item;
