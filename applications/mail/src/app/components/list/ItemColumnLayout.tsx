import React from 'react';
import { classnames } from 'react-components';
import { Label } from 'proton-shared/lib/interfaces/Label';

import ItemStar from './ItemStar';
import { ELEMENT_TYPES } from '../../constants';
import ItemLabels from './ItemLabels';
import ItemAttachmentIcon from './ItemAttachmentIcon';
import ItemLocation from './ItemLocation';
import ItemDate from './ItemDate';
import NumMessages from '../conversation/NumMessages';
import { Element } from '../../models/element';

interface Props {
    labels?: Label[];
    element: Element;
    mailSettings: any;
    type: string;
    senders: string;
    unread: boolean;
}

const ItemColumnLayout = ({ labels, element, mailSettings = {}, type, senders, unread }: Props) => {
    const { Subject } = element;
    const isConversation = type === ELEMENT_TYPES.CONVERSATION;

    return (
        <div className="flex-item-fluid flex flex-nowrap flex-column flex-spacebetween item-titlesender">
            <div className="flex">
                <div className="flex-item-fluid flex w0 pr1">
                    {isConversation ? (
                        <NumMessages className={classnames(['mr0-25', unread && 'bold'])} conversation={element} />
                    ) : (
                        <ItemLocation message={element} mailSettings={mailSettings} />
                    )}
                    <span className={classnames(['inbl mw100 ellipsis', unread && 'bold'])}>{Subject}</span>
                </div>
                <ItemDate element={element} className={unread ? 'bold' : undefined} />
            </div>
            <div className="flex">
                <div className="flex-item-fluid flex pr1">
                    <span className={classnames(['inbl mw100 ellipsis', unread && 'bold'])}>{senders}</span>
                </div>
                <div className="item-icons">
                    <ItemLabels max={4} labels={labels} element={element} />
                    {' ' /* This space is important to keep a small space between elements */}
                    <ItemAttachmentIcon element={element} />
                    {' ' /* This space is important to keep a small space between elements */}
                    <ItemStar element={element} />
                </div>
            </div>
        </div>
    );
};

export default ItemColumnLayout;
