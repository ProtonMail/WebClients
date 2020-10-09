import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import React from 'react';
import { c } from 'ttag';
import { classnames } from 'react-components';
import { Label } from 'proton-shared/lib/interfaces/Label';
import { MailSettings } from 'proton-shared/lib/interfaces';

import ItemStar from './ItemStar';
import ItemLabels from './ItemLabels';
import ItemAttachmentIcon from './ItemAttachmentIcon';
import ItemLocation from './ItemLocation';
import ItemDate from './ItemDate';
import NumMessages from '../conversation/NumMessages';
import { Element } from '../../models/element';
import ItemExpiration from './ItemExpiration';
import ItemAction from './ItemAction';

interface Props {
    labelID: string;
    labels?: Label[];
    element: Element;
    mailSettings: MailSettings;
    conversationMode: boolean;
    showIcon: boolean;
    senders: string;
    addresses: string;
    unread: boolean;
    displayRecipients: boolean;
    loading: boolean;
}

const ItemColumnLayout = ({
    labelID,
    labels,
    element,
    mailSettings,
    conversationMode,
    showIcon,
    senders,
    addresses,
    unread,
    displayRecipients,
    loading
}: Props) => {
    const { Subject } = element;

    return (
        <div className="flex-item-fluid flex flex-nowrap flex-column flex-justify-center item-titlesender">
            <div className="flex flex-items-center item-firstline">
                <div className="item-senders flex-item-fluid flex pr1">
                    <span className={classnames(['inbl mw100 ellipsis', unread && 'bold'])} title={addresses}>
                        {!loading && displayRecipients && !senders ? c('Info').t`(No Recipient)` : senders}
                    </span>
                    <ItemAction element={element} className="ml0-5 mtauto mbauto" />
                </div>
                <ItemDate
                    element={element}
                    labelID={labelID}
                    className={classnames([unread && 'bold', 'item-senddate-col'])}
                />
                <span className="ml0-5 flex-flex-children">
                    <ItemStar element={element} />
                </span>
            </div>
            <div className="flex flex-nowrap flex-items-center item-secondline mw100 no-scroll">
                <div className="item-subject flex-item-fluid flex w0 pr1 flex-nowrap">
                    {!!element.ExpirationTime && (
                        <span className="flex-item-noshrink">
                            <ItemExpiration element={element} />
                        </span>
                    )}
                    {showIcon && (
                        <span className="mr0-25 inline-flex flex-self-end alignbaseline flex-item-noshrink">
                            <ItemLocation message={element as Message} mailSettings={mailSettings} />
                        </span>
                    )}
                    {conversationMode && (
                        <NumMessages
                            className={classnames(['mr0-25 flex-item-noshrink', unread && 'bold'])}
                            conversation={element}
                        />
                    )}
                    <span className={classnames(['inbl mw100 ellipsis', unread && 'bold'])} title={Subject}>
                        {Subject}
                    </span>
                </div>
                <div className="item-icons ml0-5 flex-item-noshrink">
                    <ItemLabels labels={labels} element={element} maxNumber={5} />
                    <ItemAttachmentIcon element={element} className="ml0-5 flex-self-vcenter" />
                </div>
            </div>
        </div>
    );
};

export default ItemColumnLayout;
