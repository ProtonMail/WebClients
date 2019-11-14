import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';

import ItemStar from '../list/ItemStar';
import ItemDate from '../list/ItemDate';
import { ELEMENT_TYPES } from '../../constants';
import MessageLock from './MessageLock';
import { isSent } from './logic/message';
import ItemLabels from '../list/ItemLabels';
import ItemAttachmentIcon from '../list/ItemAttachmentIcon';

const MessageHeaderCollapsed = ({ message, labels, onExpand }) => {
    const { Name, Address } = message.data.Sender;

    const handleClick = (event) => {
        if (event.target.classList.contains('item-star') || event.target.closest('.item-star')) {
            event.stopPropagation();
            return;
        }

        onExpand();
    };

    const inOutClass = isSent(message.data) ? 'is-outbound' : 'is-inbound';

    return (
        <div
            className={`message-header flex flex-nowrap flex-items-center flex-spacebetween cursor-pointer ${inOutClass}`}
            onClick={handleClick}
        >
            <div>
                <span className="mr0-5">{c('Label').t`From:`}</span>
                <span className="bold mr0-5" title={Name}>
                    {Name}
                </span>
                <i title={Address}>&lt;{Address}&gt;</i>
                <MessageLock message={message} />
            </div>
            <div>
                <ItemAttachmentIcon element={message.data} type={ELEMENT_TYPES.MESSAGE} />
                <ItemLabels element={message.data} labels={labels} type={ELEMENT_TYPES.MESSAGE} className="mr1" />
                <ItemDate className="mr1" element={message.data} mode="distance" />
                <ItemStar element={message.data} type={ELEMENT_TYPES.MESSAGE} />
            </div>
        </div>
    );
};

MessageHeaderCollapsed.propTypes = {
    message: PropTypes.object.isRequired,
    labels: PropTypes.array.isRequired,
    onExpand: PropTypes.func
};

export default MessageHeaderCollapsed;
