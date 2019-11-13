import React from 'react';
import PropTypes from 'prop-types';

import ItemStar from './ItemStar';
import { ELEMENT_TYPES } from '../../constants';
import ItemLabels from './ItemLabels';
import ItemAttachmentIcon from './ItemAttachmentIcon';
import ItemLocation from './ItemLocation';
import ItemDate from './ItemDate';
import NumMessages from '../conversation/NumMessages';

const ItemColumnLayout = ({ labels, element, mailSettings = {}, type, senders }) => {
    const { Subject } = element;
    const isConversation = type === ELEMENT_TYPES.CONVERSATION;

    return (
        <div className="flex-item-fluid flex flex-nowrap flex-column flex-spacebetween item-titlesender">
            <div className="flex">
                <div className="flex-item-fluid w0 pr1">
                    {isConversation ? (
                        <NumMessages className="mr0-5" mailSettings={mailSettings} conversation={element} />
                    ) : (
                        <ItemLocation message={element} mailSettings={mailSettings} />
                    )}
                    <span className="inbl mw100 ellipsis">{Subject}</span>
                </div>
                <ItemDate element={element} type={type} />
            </div>
            <div className="flex">
                <div className="flex-item-fluid pr1">
                    <span className="inbl mw100 ellipsis">{senders}</span>
                </div>
                <div className="item-icons">
                    <ItemLabels max={4} type={type} labels={labels} element={element} />
                    <ItemAttachmentIcon element={element} type={type} />
                    <ItemStar element={element} type={type} />
                </div>
            </div>
        </div>
    );
};

ItemColumnLayout.propTypes = {
    labels: PropTypes.array,
    element: PropTypes.object.isRequired,
    mailSettings: PropTypes.object.isRequired,
    type: PropTypes.string.isRequired,
    senders: PropTypes.string.isRequired
};

export default ItemColumnLayout;
