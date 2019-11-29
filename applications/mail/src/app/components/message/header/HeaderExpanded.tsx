import React, { MouseEvent } from 'react';
import { c } from 'ttag';
import { SimpleDropdown, Icon, Group, ButtonGroup, useToggle } from 'react-components';
import humanSize from 'proton-shared/lib/helpers/humanSize';

import ItemStar from '../../list/ItemStar';
import ItemDate from '../../list/ItemDate';
import { ELEMENT_TYPES } from '../../../constants';
import ItemLabels from '../../list/ItemLabels';
import ItemLocation from '../../list/ItemLocation';
import MoveDropdown from '../../dropdown/MoveDropdown';
import LabelDropdown from '../../dropdown/LabelDropdown';
import HeaderExtra from './HeaderExtra';
import MessageLock from '../MessageLock';
import { isSent } from '../../../helpers/message';
import HeaderRecipientsSimple from './HeaderRecipientsSimple';
import HeaderRecipientsDetails from './HeaderRecipientsDetails';
import ItemAttachmentIcon from '../../list/ItemAttachmentIcon';
import { MessageExtended } from '../../../models/message';
import { Label } from '../../../models/label';

import './MessageHeader.scss';

interface Props {
    labels?: Label[];
    mailSettings: any;
    message: MessageExtended;
    messageLoaded: boolean;
    onLoadRemoteImages: () => void;
    onLoadEmbeddedImages: () => void;
    onCollapse: () => void;
}

const HeaderExpanded = ({
    labels,
    message,
    messageLoaded,
    onLoadRemoteImages,
    onLoadEmbeddedImages,
    mailSettings,
    onCollapse
}: Props) => {
    const { state: showDetails, toggle: toggleDetails } = useToggle();

    const { Name, Address } = (message.data || {}).Sender || {};
    const inOutClass = isSent(message.data) ? 'is-outbound' : 'is-inbound';

    const handleClick = (event: MouseEvent) => {
        if ((event.target as HTMLElement).closest('.stop-propagation')) {
            event.stopPropagation();
            return;
        }

        onCollapse();
    };

    return (
        <div className={`message-header message-header-expanded ${inOutClass}`}>
            <div
                className="flex flex-nowrap flex-items-center flex-spacebetween pt1 pl1 pr1 pb0-5 cursor-pointer"
                onClick={handleClick}
            >
                <div>
                    <span className="mr0-5">{c('Label').t`From:`}</span>
                    <span className="bold mr0-5" title={Name}>
                        {Name}
                    </span>
                    <i title={Address}>&lt;{Address}&gt;</i>
                    <MessageLock message={message} className="stop-propagation" />
                </div>
                <div>
                    <ItemDate element={message.data || {}} mode="distance" />
                </div>
            </div>
            <div className="flex flex-nowrap flex-items-start flex-spacebetween ml1 mr1 mb0-5">
                {showDetails ? (
                    <HeaderRecipientsDetails message={message.data} />
                ) : (
                    <HeaderRecipientsSimple message={message.data} />
                )}
                <div className="stop-propagation">
                    <ItemAttachmentIcon element={message.data || {}} type={ELEMENT_TYPES.MESSAGE} />
                    <ItemLabels max={4} element={message.data || {}} labels={labels} type={ELEMENT_TYPES.MESSAGE} />
                    <ItemLocation message={message.data || {}} mailSettings={mailSettings} />
                    <ItemStar element={message.data || {}} type={ELEMENT_TYPES.MESSAGE} />
                </div>
            </div>
            {showDetails ? (
                <>
                    <div className="ml1 mr1 mb0-5">
                        <span className="mr0-5">{c('Label').t`Size:`}</span>
                        <span>{humanSize((message.data || {}).Size || 0)}</span>
                    </div>
                    <div className="ml1 mr1 mb0-5">
                        <ItemDate element={message.data || {}} mode="full" />
                    </div>
                </>
            ) : null}
            <HeaderExtra
                message={message}
                onLoadRemoteImages={onLoadRemoteImages}
                onLoadEmbeddedImages={onLoadEmbeddedImages}
            />
            <div className="flex flex-spacebetween ml1 mr1 mb1 flex-nowrap">
                <a onClick={toggleDetails} className="bold flex-self-vcenter stop-propagation">
                    {showDetails ? c('Action').t`Hide details` : c('Action').t`Show details`}
                </a>
                <div className="stop-propagation">
                    <Group className="mr1">
                        <SimpleDropdown autoClose={false} content={<Icon name="folder" />}>
                            <MoveDropdown selectedIDs={[(message.data || {}).ID]} type={ELEMENT_TYPES.MESSAGE} />
                        </SimpleDropdown>
                        <SimpleDropdown autoClose={false} content={<Icon name="label" />}>
                            <LabelDropdown selectedIDs={[(message.data || {}).ID]} type={ELEMENT_TYPES.MESSAGE} />
                        </SimpleDropdown>
                    </Group>

                    <Group>
                        <ButtonGroup disabled={!messageLoaded}>
                            <Icon name="reply" />
                        </ButtonGroup>
                        <ButtonGroup disabled={!messageLoaded}>
                            <Icon name="reply-all" />
                        </ButtonGroup>
                        <ButtonGroup disabled={!messageLoaded}>
                            <Icon name="forward" />
                        </ButtonGroup>
                    </Group>
                </div>
            </div>
        </div>
    );
};

export default HeaderExpanded;
