import React from 'react';
import PropTypes from 'prop-types';

import ItemStar from './ItemStar';
import { ELEMENT_TYPES } from '../../constants';
import ItemLabels from './ItemLabels';
import ItemAttachmentIcon from './ItemAttachmentIcon';
import ItemLocation from './ItemLocation';
import ItemDate from './ItemDate';
import NumMessages from '../conversation/NumMessages';
import humanSize from 'proton-shared/lib/helpers/humanSize';

const ItemRowLayout = ({ labels, element, mailSettings = {}, type, senders }) => {
    const { Subject, Size } = element;
    const isConversation = type === ELEMENT_TYPES.CONVERSATION;
    const size = humanSize(Size);

    return (
        <div className="flex-item-fluid flex flex-nowrap flex-row flex-spacebetween item-titlesender">
            <div className="w20 flex mauto pr1">{senders}</div>
            <div className="flex-item-fluid flex mauto">
                {isConversation ? (
                    <NumMessages className="mr0-5" mailSettings={mailSettings} conversation={element} />
                ) : (
                    <ItemLocation message={element} mailSettings={mailSettings} />
                )}
                <span className="inbl mw100 ellipsis">{Subject}</span>
                <ItemLabels max={4} type={type} labels={labels} element={element} />
                <ItemAttachmentIcon element={element} type={type} />
            </div>
            <span className="mtauto mbauto mr1 ml1 ng-binding">{size}</span>
            <span className="mauto">
                <ItemDate element={element} type={type} />
            </span>
            <span className="mauto">
                <ItemStar element={element} type={type} />
            </span>
        </div>
    );
};

ItemRowLayout.propTypes = {
    labels: PropTypes.array,
    element: PropTypes.object.isRequired,
    mailSettings: PropTypes.object.isRequired,
    type: PropTypes.string.isRequired,
    senders: PropTypes.string.isRequired
};

export default ItemRowLayout;
