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
import { Element } from '../../models/element';
import ItemExpiration from './ItemExpiration';
import ItemAction from './ItemAction';
import { Breakpoints } from '../../models/utils';

interface Props {
    labelID: string;
    labels?: Label[];
    element: Element;
    conversationMode: boolean;
    showIcon: boolean;
    senders: string;
    addresses: string;
    unread: boolean;
    displayRecipients: boolean;
    loading: boolean;
    breakpoints: Breakpoints;
}

const ItemColumnLayout = ({
    labelID,
    labels,
    element,
    conversationMode,
    showIcon,
    senders,
    addresses,
    unread,
    displayRecipients,
    loading,
    breakpoints,
}: Props) => {
    const { Subject } = element;

    return (
        <div
            className="flex-item-fluid flex flex-nowrap flex-column flex-justify-center item-titlesender"
            data-test-id="message-list:message"
        >
            <div className="flex flex-align-items-center item-firstline">
                <div className="item-senders flex-item-fluid flex flex-nowrap pr1">
                    <span
                        className={classnames(['inline-block max-w100 text-ellipsis', unread && 'text-bold'])}
                        title={addresses}
                        data-test-id="message-list:sender-address"
                    >
                        {!loading && displayRecipients && !senders ? c('Info').t`(No Recipient)` : senders}
                    </span>
                    <ItemAction element={element} className="ml0-5 flex-item-noshrink mtauto mbauto" />
                </div>

                {!!element.ExpirationTime && (
                    <span className="flex-item-noshrink">
                        <ItemExpiration element={element} className="mr0-5" />
                    </span>
                )}

                <ItemDate
                    element={element}
                    labelID={labelID}
                    className={classnames([unread && 'text-bold', 'item-senddate-col'])}
                />

                <span className="ml0-5 flex-flex-children">
                    <ItemStar element={element} />
                </span>
            </div>

            <div className="flex flex-nowrap flex-align-items-center item-secondline max-w100 no-scroll">
                <div className="item-subject flex-item-fluid flex flex-nowrap flex-align-items-center">
                    {showIcon && (
                        <span className="flex flex-item-noshrink">
                            <ItemLocation element={element} labelID={labelID} />
                        </span>
                    )}

                    {conversationMode && (
                        <NumMessages
                            className={classnames(['mr0-25 flex-item-noshrink', unread && 'text-bold'])}
                            conversation={element}
                        />
                    )}

                    <span
                        role="heading"
                        aria-level={2}
                        className={classnames(['inline-block max-w100 text-ellipsis', unread && 'text-bold'])}
                        title={Subject}
                        data-test-id="message-list:subject"
                    >
                        {Subject}
                    </span>
                </div>

                <div className="item-icons flex flex-item-noshrink flex-nowrap">
                    <ItemLabels
                        className="ml0-5"
                        labels={labels}
                        element={element}
                        labelID={labelID}
                        maxNumber={breakpoints.isNarrow ? 1 : 5}
                    />
                    <ItemAttachmentIcon element={element} className="ml0-25 flex-align-self-center" />
                </div>
            </div>
        </div>
    );
};

export default ItemColumnLayout;
