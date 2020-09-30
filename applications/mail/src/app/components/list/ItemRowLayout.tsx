import React from 'react';
import { c } from 'ttag';
import { classnames } from 'react-components';
import { Label } from 'proton-shared/lib/interfaces/Label';

import ItemStar from './ItemStar';
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
    conversationMode: boolean;
    showIcon: boolean;
    senders: string;
    addresses: string;
    unread: boolean;
    displayRecipients: boolean;
    loading: boolean;
}

const ItemRowLayout = ({
    labelID,
    labels,
    element,
    mailSettings = {},
    conversationMode,
    showIcon,
    senders,
    addresses,
    unread,
    displayRecipients,
    loading
}: Props) => {
    const { Subject, Size } = element;
    const size = humanSize(Size);

    return (
        <div className="flex-item-fluid flex flex-items-center flex-nowrap flex-row item-titlesender">
            <div className="mtauto mbauto flex mr0-5">
                <ItemStar element={element} />
            </div>
            <div className={classnames(['item-senders w20 flex mauto pr1', unread && 'bold'])}>
                <span className="mw100 ellipsis" title={addresses}>
                    {!loading && displayRecipients && !senders ? c('Info').t`(No Recipient)` : senders}
                </span>
            </div>
            <div className="item-subject flex-item-fluid flex flex-items-center flex-nowrap mauto">
                {!!element.ExpirationTime && <ItemExpiration element={element} />}
                {showIcon && (
                    <span className="mr0-25 inline-flex flex-item-noshrink">
                        <ItemLocation message={element as Message} mailSettings={mailSettings} />
                    </span>
                )}
                {conversationMode && (
                    <NumMessages
                        className={classnames(['mr0-25 flex-item-noshrink', unread && 'bold'])}
                        conversation={element}
                    />
                )}
                <span className={classnames(['inbl mw100 ellipsis pr1', unread && 'bold'])} title={Subject}>
                    {Subject}
                </span>
                <span className="mlauto flex flex-item-noshrink">
                    <ItemLabels labels={labels} element={element} className="flex-item-noshrink flex flex-nowrap" />
                    <ItemAttachmentIcon element={element} className="ml0-5 flex-item-noshrink flex-self-vcenter" />
                </span>
            </div>
            <span className="item-weight mtauto mbauto mr1 ml1 alignright">{!loading && size}</span>
            <span className="item-senddate-row mauto w11e alignright">
                <ItemDate element={element} labelID={labelID} className={unread ? 'bold' : undefined} />
            </span>
        </div>
    );
};

export default ItemRowLayout;
