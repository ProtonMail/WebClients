import React from 'react';
import { c } from 'ttag';
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
import { Message } from '../../models/message';

interface Props {
    labels?: Label[];
    element: Element;
    mailSettings: any;
    type: string;
    showIcon: boolean;
    senders: string;
    unread: boolean;
    displayRecipients: boolean;
}

const ItemColumnLayout = ({
    labels,
    element,
    mailSettings = {},
    type,
    showIcon,
    senders,
    unread,
    displayRecipients
}: Props) => {
    const { Subject } = element;
    const isConversation = type === ELEMENT_TYPES.CONVERSATION;

    return (
        <div className="flex-item-fluid flex flex-nowrap flex-column flex-spacebetween item-titlesender">
            <div className="flex flex-items-center item-firstline">
                <div className="flex-item-fluid flex pr1">
                    <span className={classnames(['inbl mw100 ellipsis', unread && 'bold'])}>
                        {displayRecipients && !senders ? c('Info').t`(No Recipient)` : senders}
                    </span>
                </div>
                <ItemDate element={element} className={classnames([unread && 'bold'])} />
                <span className="ml0-5 flex">
                    <ItemStar element={element} />
                </span>
            </div>
            <div className="flex flex-items-center item-secondline mw100">
                <div className="flex-item-fluid flex w0 pr1 flex-nowrap item-sender--smaller">
                    {/* add expiration icon, in red, 12px */}
                    {showIcon && <ItemLocation message={element as Message} mailSettings={mailSettings} />}
                    {isConversation && (
                        <NumMessages
                            className={classnames(['mr0-25 flex-item-noshrink', unread && 'bold'])}
                            conversation={element}
                        />
                    )}
                    <span className={classnames(['inbl mw100 ellipsis', unread && 'bold'])}>{Subject}</span>
                </div>
                <div className="item-icons ml0-5">
                    <ItemLabels max={4} labels={labels} element={element} />
                    <ItemAttachmentIcon element={element} className="ml0-5 flex-self-vcenter" />
                </div>
            </div>
        </div>
    );
};

export default ItemColumnLayout;
