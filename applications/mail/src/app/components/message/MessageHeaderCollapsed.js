import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';

import ItemStar from '../list/ItemStar';
import ItemDate from '../list/ItemDate';
import { ELEMENT_TYPES } from '../../constants';
import MessageLock from './MessageLock';

const MessageHeaderCollapsed = ({ message, onExpand }) => {
    const { Name, Address } = message.data.Sender;

    const handleClick = (event) => {
        if (event.target.classList.contains('item-star') || event.target.closest('.item-star')) {
            event.stopPropagation();
            return;
        }

        onExpand();
    };

    return (
        <article
            className="bg-global-light bordered-container pl1 pr1 pt0-5 pb0-5 mb1 flex flex-nowrap flex-items-center flex-spacebetween"
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
                <ItemDate className="mr1" element={message.data} type={ELEMENT_TYPES.MESSAGE} />
                <ItemStar element={message.data} type={ELEMENT_TYPES.MESSAGE} />
            </div>
        </article>
    );
};

MessageHeaderCollapsed.propTypes = {
    message: PropTypes.object.isRequired,
    onExpand: PropTypes.func
};

export default MessageHeaderCollapsed;
