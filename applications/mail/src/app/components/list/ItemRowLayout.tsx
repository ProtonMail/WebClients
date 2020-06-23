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
import humanSize from 'proton-shared/lib/helpers/humanSize';
import { Element } from '../../models/element';
import { Message } from '../../models/message';
import ItemExpiration from './ItemExpiration';

interface Props {
    labelID: string;
    labels?: Label[];
    element: Element;
    mailSettings: any;
    type: string;
    showIcon: boolean;
    senders: string;
    unread: boolean;
    displayRecipients: boolean;
}

const ItemRowLayout = ({
    labelID,
    labels,
    element,
    mailSettings = {},
    type,
    showIcon,
    senders,
    unread,
    displayRecipients
}: Props) => {
    const { Subject, Size } = element;
    const isConversation = type === ELEMENT_TYPES.CONVERSATION;
    const size = humanSize(Size);

    return (
        <div className="flex-item-fluid flex flex-items-center flex-nowrap flex-row item-titlesender">
            <div className="mtauto mbauto flex mr0-5">
                <ItemStar element={element} />
            </div>
            <div className={classnames(['w20 flex mauto pr1', unread && 'bold'])}>
                <span className="mw100 ellipsis">
                    {displayRecipients && !senders ? c('Info').t`(No Recipient)` : senders}
                </span>
            </div>
            <div className="flex-item-fluid flex flex-items-center flex-nowrap mauto">
                <ItemExpiration element={element} />
                {showIcon && (
                    <span className="mr0-25 inline-flex flex-item-noshrink">
                        <ItemLocation message={element as Message} mailSettings={mailSettings} />
                    </span>
                )}
                {isConversation && (
                    <NumMessages className={classnames(['mr0-25', unread && 'bold'])} conversation={element} />
                )}
                <span className={classnames(['inbl mw100 ellipsis', unread && 'bold'])}>{Subject}</span>
                <ItemLabels max={4} labels={labels} element={element} className="mlauto flex flex-nowrap" />
                <ItemAttachmentIcon element={element} className="ml0-5 flex-self-vcenter" />
            </div>
            <span className="mtauto mbauto mr1 ml1 ng-binding">{size}</span>
            <span className="mauto w10e alignright">
                <ItemDate element={element} labelID={labelID} className={unread ? 'bold' : undefined} />
            </span>
        </div>
    );
};

export default ItemRowLayout;
