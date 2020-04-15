import React, { ChangeEvent, MouseEvent, DragEvent } from 'react';
import { Location } from 'history';
import { classnames, Checkbox } from 'react-components';
import { getInitial } from 'proton-shared/lib/helpers/string';
import { MAILBOX_LABEL_IDS, VIEW_LAYOUT, DENSITY } from 'proton-shared/lib/constants';
import { Label } from 'proton-shared/lib/interfaces/Label';
import { ContactEmail, ContactGroup } from 'proton-shared/lib/interfaces/contacts';
import { MailSettings, UserSettings } from 'proton-shared/lib/interfaces';

import ItemCheckbox from './ItemCheckbox';
import { getRecipients as getMessageRecipients, getSender, getRecipients } from '../../helpers/message/messages';
import { getCurrentType, isUnread } from '../../helpers/elements';
import ItemColumnLayout from './ItemColumnLayout';
import ItemRowLayout from './ItemRowLayout';
import { Element } from '../../models/element';
import { ELEMENT_TYPES } from '../../constants';
import { getSenders } from '../../helpers/conversation';
import { getRecipientLabel, recipientsToRecipientOrGroup, getRecipientOrGroupLabel } from '../../helpers/addresses';
import { isCustomLabel } from '../../helpers/labels';

const { SENT, ALL_SENT, DRAFTS, ALL_DRAFTS } = MAILBOX_LABEL_IDS;

interface Props {
    location: Location;
    labels?: Label[];
    labelID: string;
    elementID?: string;
    userSettings: UserSettings;
    mailSettings: MailSettings;
    element: Element;
    checked?: boolean;
    contacts: ContactEmail[];
    contactGroups: ContactGroup[];
    onCheck: (event: ChangeEvent) => void;
    onClick: (element: Element) => void;
    onDragStart: (event: DragEvent) => void;
    onDragEnd: (event: DragEvent) => void;
    dragged: boolean;
}

const Item = ({
    location,
    labelID,
    labels,
    element,
    elementID,
    userSettings,
    mailSettings,
    checked = false,
    contacts,
    contactGroups,
    onCheck,
    onClick,
    onDragStart,
    onDragEnd,
    dragged
}: Props) => {
    const { ID = '' } = element;
    const displayRecipients = [SENT, ALL_SENT, DRAFTS, ALL_DRAFTS].includes(labelID as MAILBOX_LABEL_IDS);
    const type = getCurrentType({ mailSettings, labelID, location });
    const isCompactView = userSettings.Density === DENSITY.COMPACT;
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
        onDragStart(event);
    };

    const handleDragEnd = (event: DragEvent) => {
        onDragEnd(event);
    };

    const itemCheckboxType = isCompactView ? (
        <Checkbox className="item-icon-compact mr1" checked={checked} onChange={onCheck} />
    ) : (
        <ItemCheckbox className="mr1 item-checkbox" checked={checked} onChange={onCheck}>
            {getInitial(displayRecipients ? recipientsLabels[0] : sendersLabels[0])}
        </ItemCheckbox>
    );

    return (
        <div
            onClick={handleClick}
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            className={classnames([
                'flex flex-nowrap flex-items-center cursor-pointer',
                isColumnMode ? 'item-container' : 'item-container-row',
                elementID === ID && 'item-is-selected',
                !unread && 'read',
                dragged && 'item-dragging'
            ])}
        >
            {itemCheckboxType}
            <ItemLayout
                labels={labels}
                element={element}
                mailSettings={mailSettings}
                type={type}
                showIcon={showIcon}
                senders={(displayRecipients ? recipientsLabels : sendersLabels).join(', ')}
                unread={unread}
                displayRecipients={displayRecipients}
            />
        </div>
    );
};

export default Item;
