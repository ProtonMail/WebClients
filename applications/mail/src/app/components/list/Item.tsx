import React, { ChangeEvent } from 'react';
import { classnames } from 'react-components';
import { getInitial } from 'proton-shared/lib/helpers/string';
import { MAILBOX_LABEL_IDS, VIEW_LAYOUT } from 'proton-shared/lib/constants';

import ItemCheckbox from './ItemCheckbox';
import { getSenders, getRecipients } from '../../helpers/conversation';
import { getSender, getRecipients as getMessageRecipients } from '../../helpers/message';
import { getCurrentType, isUnread } from '../../helpers/elements';
import ItemColumnLayout from './ItemColumnLayout';
import ItemRowLayout from './ItemRowLayout';
import { Label } from '../../models/label';
import { Element } from '../../models/element';
import { ELEMENT_TYPES } from '../../constants';

const { SENT, ALL_SENT, DRAFTS, ALL_DRAFTS } = MAILBOX_LABEL_IDS;

interface Props {
    labels?: Label[];
    labelID: string;
    elementID?: string;
    mailSettings: any;
    element: Element;
    checked?: boolean;
    onCheck: (event: ChangeEvent) => void;
    onClick: (ID: string) => void;
}

const Item = ({ labelID, labels, element, elementID, mailSettings = {}, checked = false, onCheck, onClick }: Props) => {
    const { ID = '' } = element;
    const displayRecipients = [SENT, ALL_SENT, DRAFTS, ALL_DRAFTS].includes(labelID as MAILBOX_LABEL_IDS);
    const type = getCurrentType({ mailSettings, labelID });
    const isConversation = type === ELEMENT_TYPES.CONVERSATION;
    const senders = isConversation ? getSenders(element) : [getSender(element)];
    const recipients = isConversation ? getRecipients(element) : getMessageRecipients(element);

    const { ViewLayout = VIEW_LAYOUT.COLUMN } = mailSettings;
    const isColumnMode = ViewLayout === VIEW_LAYOUT.COLUMN;
    const ItemLayout = isColumnMode ? ItemColumnLayout : ItemRowLayout;
    const unread = isUnread(element);

    const clickHandler = (event: React.MouseEvent) => {
        const target = event.target as HTMLElement;
        if (target.classList.contains('item-checkbox') || target.closest('.item-checkbox')) {
            event.stopPropagation();
            return;
        }
        onClick(ID);
    };

    return (
        <div
            onClick={clickHandler}
            className={classnames([
                'flex flex-nowrap cursor-pointer',
                isColumnMode ? 'item-container' : 'item-container-row',
                elementID === ID && 'item-is-selected',
                !unread && 'read'
            ])}
        >
            <ItemCheckbox className="mr1 item-checkbox" checked={checked} onChange={onCheck}>
                {getInitial(displayRecipients ? recipients[0] : senders[0])}
            </ItemCheckbox>
            <ItemLayout
                labels={labels}
                element={element}
                mailSettings={mailSettings}
                type={type}
                senders={(displayRecipients ? recipients : senders).join(', ')}
                unread={unread}
            />
        </div>
    );
};

export default Item;
