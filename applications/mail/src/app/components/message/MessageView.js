import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';

import ItemStar from '../list/ItemStar';
import ItemDate from '../list/ItemDate';
import { ELEMENT_TYPES } from '../../constants';

const MessageView = ({ message, expanded = false, onExpand }) => {
    if (!expanded) {
        return (
            <article
                className="bg-global-light bordered-container pl1 pr1 pt0-5 pb0-5 mb1 flex flex-nowrap flex-items-center flex-spacebetween"
                onClick={(event) => {
                    if (event.target.classList.contains('item-star') || event.target.closest('.item-star')) {
                        event.stopPropagation();
                        return;
                    }
                    onExpand(message.ID);
                }}
            >
                <div>
                    <span className="mr0-5">{c('Label').t`From:`}</span>
                    <span className="bold mr0-5" title={message.Sender.Name}>
                        {message.Sender.Name}
                    </span>
                    <i title={message.Sender.Address}>&lt;{message.Sender.Address}&gt;</i>
                </div>
                <div>
                    <ItemDate className="mr1" element={message} type={ELEMENT_TYPES.MESSAGE} />
                    <ItemStar element={message} type={ELEMENT_TYPES.MESSAGE} />
                </div>
            </article>
        );
    }

    return (
        <article className="bordered-container mb1">
            <div className="bg-global-light p1">
                <div className="mb0-5">
                    <span>{c('Label').t`From:`}</span>
                </div>
                <div></div>
            </div>
        </article>
    );
};

MessageView.propTypes = {
    message: PropTypes.object.isRequired,
    expanded: PropTypes.bool,
    onExpand: PropTypes.func
};

export default MessageView;
