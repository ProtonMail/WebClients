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
import {
    recipientsToRecipientOrGroup,
    getRecipientLabelDetailed,
    getRecipientOrGroupLabelDetailed
} from '../../helpers/addresses';
import { isCustomLabel } from '../../helpers/labels';
import { Message } from '../../models/message';

const { SENT, ALL_SENT, ALL_MAIL, STARRED, DRAFTS, ALL_DRAFTS } = MAILBOX_LABEL_IDS;

const labelsWithIcons = [ALL_MAIL, STARRED, SENT, ALL_SENT, DRAFTS, ALL_DRAFTS] as string[];

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
    onDragCanceled: () => void;
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
    onDragCanceled,
    dragged,
    index
}: Props) => {
    const { ID = '' } = element;
    const displayRecipients = [SENT, ALL_SENT].includes(labelID as MAILBOX_LABEL_IDS);
    const type = getCurrentType({ mailSettings, labelID, location });
    const isCompactView = userSettings.Density === DENSITY.COMPACT;
    const isConversation = type === ELEMENT_TYPES.CONVERSATION;
    const showIcon = labelsWithIcons.includes(labelID) || isCustomLabel(labelID, labels);
    const senders = isConversation ? getSenders(element) : [getSender(element as Message)];
    const recipients = isConversation ? getConversationRecipients(element) : getMessageRecipients(element as Message);
    const sendersLabels = senders.map((sender) => getRecipientLabelDetailed(sender, contacts));
    const sendersAddresses = senders.map((sender) => sender?.Address);
    const recipientsOrGroup = recipientsToRecipientOrGroup(recipients, contactGroups);
    const recipientsLabels = recipientsOrGroup.map((recipientOrGroup) =>
        getRecipientOrGroupLabelDetailed(recipientOrGroup, contacts)
    );
    const recipientsAddresses = recipientsOrGroup
        .map(({ recipient, group }) =>
            recipient ? recipient.Address : group?.recipients.map((recipient) => recipient.Address)
        )
        .flat();

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

    const handleDragEnd = (event: DragEvent) => {
        if (event.dataTransfer.dropEffect === 'none') {
            return onDragCanceled();
        }
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
            onDragStart={onDragStart}
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
                addresses={(displayRecipients ? recipientsAddresses : sendersAddresses).join(', ')}
                unread={unread}
                displayRecipients={displayRecipients}
                loading={loading}
            />
        </div>
    );
};

export default Item;
