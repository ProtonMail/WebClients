import React, { ChangeEvent, MouseEvent, DragEvent } from 'react';
import { Location } from 'history';
import { classnames, Checkbox } from 'react-components';
import { getInitial } from 'proton-shared/lib/helpers/string';
import { MAILBOX_LABEL_IDS, DENSITY } from 'proton-shared/lib/constants';
import { Label } from 'proton-shared/lib/interfaces/Label';
import { ContactEmail, ContactGroup } from 'proton-shared/lib/interfaces/contacts';
import { MailSettings, UserSettings } from 'proton-shared/lib/interfaces';

import ItemCheckbox from './ItemCheckbox';
import { getRecipients as getMessageRecipients, getSender } from '../../helpers/message/messages';
import { getCurrentType, isUnread } from '../../helpers/elements';
import ItemColumnLayout from './ItemColumnLayout';
import ItemRowLayout from './ItemRowLayout';
import { Element } from '../../models/element';
import { ELEMENT_TYPES } from '../../constants';
import { getSenders, getRecipients as getConversationRecipients } from '../../helpers/conversation';
import { getRecipientLabel, recipientsToRecipientOrGroup, getRecipientOrGroupLabel } from '../../helpers/addresses';
import { isCustomLabel } from '../../helpers/labels';
import { Message } from '../../models/message';

const { SENT, ALL_SENT } = MAILBOX_LABEL_IDS;

interface Props {
    location: Location;
    labels?: Label[];
    labelID: string;
    loading: boolean;
    elementID?: string;
    userSettings: UserSettings;
    mailSettings: MailSettings;
    columnLayout: boolean;
    element: Element;
    checked?: boolean;
    contacts: ContactEmail[];
    contactGroups: ContactGroup[];
    onCheck: (event: ChangeEvent) => void;
    onClick: (element: Element) => void;
    onDragStart: (event: DragEvent) => void;
    onDragEnd: (event: DragEvent) => void;
    dragged: boolean;
    index: number;
}

const Item = ({
    location,
    labelID,
    labels,
    loading,
    element,
    elementID,
    columnLayout,
    userSettings,
    mailSettings,
    checked = false,
    contacts,
    contactGroups,
    onCheck,
    onClick,
    onDragStart,
    onDragEnd,
    dragged,
    index
}: Props) => {
    const { ID = '' } = element;
    const displayRecipients = [SENT, ALL_SENT].includes(labelID as MAILBOX_LABEL_IDS);
    const type = getCurrentType({ mailSettings, labelID, location });
    const isCompactView = userSettings.Density === DENSITY.COMPACT;
    const isConversation = type === ELEMENT_TYPES.CONVERSATION;
    const showIcon =
        labelID === MAILBOX_LABEL_IDS.ALL_MAIL ||
        labelID === MAILBOX_LABEL_IDS.STARRED ||
        isCustomLabel(labelID, labels);
    const senders = isConversation ? getSenders(element) : [getSender(element as Message)];
    const recipients = isConversation ? getConversationRecipients(element) : getMessageRecipients(element as Message);
    const sendersLabels = senders.map(getRecipientLabel);
    const recipientsOrGroup = recipientsToRecipientOrGroup(recipients, contactGroups);
    const recipientsLabels = recipientsOrGroup.map((recipientOrGroup) =>
        getRecipientOrGroupLabel(recipientOrGroup, contacts)
    );

    const ItemLayout = columnLayout ? ItemColumnLayout : ItemRowLayout;
    const unread = isUnread(element, labelID);

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
        <Checkbox className="item-icon-compact mr0-75 stop-propagation" checked={checked} onChange={onCheck} />
    ) : (
        <ItemCheckbox
            className={classnames(['item-checkbox-label ml0-1', columnLayout ? 'mr0-6' : 'mr0-5'])}
            checked={checked}
            onChange={onCheck}
        >
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
                columnLayout ? 'item-container' : 'item-container-row',
                elementID === ID && 'item-is-selected',
                !unread && 'read',
                dragged && 'item-dragging',
                loading && 'item-is-loading'
            ])}
            style={{ '--index': index }}
        >
            {itemCheckboxType}
            <ItemLayout
                labelID={labelID}
                labels={labels}
                element={element}
                mailSettings={mailSettings}
                type={type}
                showIcon={showIcon}
                senders={(displayRecipients ? recipientsLabels : sendersLabels).join(', ')}
                unread={unread}
                displayRecipients={displayRecipients}
                loading={loading}
            />
        </div>
    );
};

export default Item;
