import React from 'react';
import { c } from 'ttag';
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
    displayRecipients,
    loading,
    breakpoints,
}: Props) => {
    const { Subject } = element;

    return (
        <div
            className="flex-item-fluid flex flex-nowrap flex-column flex-justify-center item-titlesender"
            data-testid="message-list:message"
        >
            <div className="flex flex-align-items-center item-firstline">
                <div className="item-senders flex-item-fluid flex flex-nowrap pr1">
                    <span
                        className="inline-block max-w100 text-ellipsis"
                        title={addresses}
                        data-testid="message-column:sender-address"
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

                <ItemDate element={element} labelID={labelID} className="item-senddate-col" />

                <span className="ml0-5 flex-flex-children flex-item-centered-vert">
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

                    {conversationMode && <NumMessages className="mr0-25 flex-item-noshrink" conversation={element} />}

                    <span
                        role="heading"
                        aria-level={2}
                        className="inline-block max-w100 text-ellipsis"
                        title={Subject}
                        data-testid="message-column:subject"
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
                    <ItemAttachmentIcon element={element} className="ml0-5 flex-align-self-center" />
                </div>
            </div>
        </div>
    );
};

export default ItemColumnLayout;
