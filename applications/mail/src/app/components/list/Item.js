import React from 'react';
import PropTypes from 'prop-types';
import { classnames } from 'react-components';
import { getInitial } from 'proton-shared/lib/helpers/string';
import { MAILBOX_LABEL_IDS, VIEW_LAYOUT } from 'proton-shared/lib/constants';

import ItemCheckbox from './ItemCheckbox';
import { getSenders, getRecipients } from '../../helpers/conversation';
import { getSender, getRecipients as getMessageRecipients } from '../../helpers/message';
import { getCurrentType } from '../../helpers/element';
import ItemColumnLayout from './ItemColumnLayout';
import ItemRowLayout from './ItemRowLayout';
import { isConversation } from '../../helpers/element';

const { SENT, SENT_ALL, DRAFTS, DRAFTS_ALL } = MAILBOX_LABEL_IDS;

const Item = ({ labelID, labels, element, elementID, mailSettings = {}, checked = false, onCheck, onClick }) => {
    const { ID } = element;
    const displayRecipients = [SENT, SENT_ALL, DRAFTS, DRAFTS_ALL].includes(labelID);
    const type = getCurrentType({ mailSettings, labelID });
    // const isConversation = type === ELEMENT_TYPES.CONVERSATION;
    const senders = isConversation(element) ? getSenders(element) : [getSender(element)];
    const recipients = isConversation(element) ? getRecipients(element) : getMessageRecipients(element);

    const { ViewLayout = VIEW_LAYOUT.COLUMN } = mailSettings;
    const isColumnMode = ViewLayout === VIEW_LAYOUT.COLUMN;
    const ItemLayout = isColumnMode ? ItemColumnLayout : ItemRowLayout;

    return (
        <div
            onClick={(event) => {
                if (event.target.classList.contains('item-checkbox') || event.target.closest('.item-checkbox')) {
                    event.stopPropagation();
                    return;
                }
                onClick(ID);
            }}
            className={classnames([
                'flex flex-nowrap item-container bg-global-white',
                elementID === ID && 'item-is-selected'
            ])}
        >
            <ItemCheckbox
                className="mr1 item-checkbox"
                checked={checked}
                onChange={onCheck}
                data-element-id={element.ID}
            >
                {getInitial(displayRecipients ? recipients[0] : senders[0])}
            </ItemCheckbox>
            <ItemLayout
                labels={labels}
                element={element}
                mailSettings={mailSettings}
                type={type}
                senders={(displayRecipients ? recipients : senders).join(', ')}
            />
        </div>
    );
};

Item.propTypes = {
    labels: PropTypes.array,
    labelID: PropTypes.string.isRequired,
    elementID: PropTypes.string,
    mailSettings: PropTypes.object.isRequired,
    element: PropTypes.object.isRequired,
    checked: PropTypes.bool,
    onCheck: PropTypes.func.isRequired,
    onClick: PropTypes.func.isRequired
};

export default Item;
