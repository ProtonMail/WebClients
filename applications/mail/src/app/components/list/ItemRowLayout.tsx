import React from 'react';
import { classnames } from 'react-components';

import ItemStar from './ItemStar';
import { ELEMENT_TYPES } from '../../constants';
import ItemLabels from './ItemLabels';
import ItemAttachmentIcon from './ItemAttachmentIcon';
import ItemLocation from './ItemLocation';
import ItemDate from './ItemDate';
import NumMessages from '../conversation/NumMessages';
import humanSize from 'proton-shared/lib/helpers/humanSize';
import { Label } from '../../models/label';
import { Element } from '../../models/element';

interface Props {
    labels?: Label[];
    element: Element;
    mailSettings: any;
    type: string;
    senders: string;
    unread: boolean;
}

const ItemRowLayout = ({ labels, element, mailSettings = {}, type, senders, unread }: Props) => {
    const { Subject, Size } = element;
    const isConversation = type === ELEMENT_TYPES.CONVERSATION;
    const size = humanSize(Size);

    return (
        <div className="flex-item-fluid flex flex-nowrap flex-row flex-spacebetween item-titlesender">
            <div className={classnames(['w20 flex mauto pr1', unread && 'bold'])}>{senders}</div>
            <div className="flex-item-fluid flex mauto">
                {isConversation ? (
                    <NumMessages className={classnames(['mr0-25', unread && 'bold'])} conversation={element} />
                ) : (
                    <ItemLocation message={element} mailSettings={mailSettings} />
                )}
                <span className={classnames(['inbl mw100 ellipsis', unread && 'bold'])}>{Subject}</span>
                <ItemLabels max={4} labels={labels} element={element} />
                <ItemAttachmentIcon element={element} type={type} className="ml0-5" />
            </div>
            <span className="mtauto mbauto mr1 ml1 ng-binding">{size}</span>
            <span className="mauto">
                <ItemDate element={element} className={unread ? 'bold' : undefined} />
            </span>
            <div className="mtauto mbauto ml0-5">
                <ItemStar element={element} type={type} />
            </div>
        </div>
    );
};

export default ItemRowLayout;
