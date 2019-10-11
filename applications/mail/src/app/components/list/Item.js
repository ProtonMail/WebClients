import React from 'react';
import PropTypes from 'prop-types';
import { classnames } from 'react-components';
import { getInitial } from 'proton-shared/lib/helpers/string';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';

import ItemCheckbox from './ItemCheckbox';
import ItemStar from './ItemStar';
import { getSenders, getRecipients } from '../../helpers/conversation';
import { getSender, getRecipients as getMessageRecipients } from '../../helpers/message';
import { ELEMENT_TYPES } from '../../constants';
import ItemLabels from './ItemLabels';
import ItemAttachmentIcon from './ItemAttachmentIcon';
import ItemLocation from './ItemLocation';
import { getCurrentType } from '../../helpers/element';

const { SENT, SENT_ALL, DRAFTS, DRAFTS_ALL } = MAILBOX_LABEL_IDS;

const Item = ({ labelID, labels, element, elementID, mailSettings = {}, checked = false, onCheck, onClick }) => {
    const { ID, Subject, Time } = element;
    const displayRecipients = [SENT, SENT_ALL, DRAFTS, DRAFTS_ALL].includes(labelID);
    const type = getCurrentType({ mailSettings, labelID });
    const isConversation = type === ELEMENT_TYPES.CONVERSATION;
    const senders = isConversation ? getSenders(element) : [getSender(element)];
    const recipients = isConversation ? getRecipients(element) : getMessageRecipients(element);

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
            <div className="flex-item-fluid flex flex-nowrap flex-column flex-spacebetween item-titlesender">
                <div className="flex">
                    <div className="flex-item-fluid w0 pr1">
                        {type === ELEMENT_TYPES.MESSAGE ? <ItemLocation message={element} /> : null}
                        <span className="inbl mw100 ellipsis">{Subject}</span>
                    </div>
                    <div className="item-date flex-item-noshrink">{Time}</div>
                </div>
                <div className="flex">
                    <div className="flex-item-fluid pr1">
                        <span className="inbl mw100 ellipsis">
                            {(displayRecipients ? recipients : senders).join(', ')}
                        </span>
                    </div>
                    <div className="item-icons">
                        <ItemLabels max={4} type={type} labels={labels} element={element} />
                        <ItemAttachmentIcon element={element} type={type} />
                        <ItemStar element={element} type={type} />
                    </div>
                </div>
            </div>
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
