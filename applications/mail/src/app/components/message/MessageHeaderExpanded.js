import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { SimpleDropdown, Icon, Group, ButtonGroup } from 'react-components';

import ItemStar from '../list/ItemStar';
import ItemDate from '../list/ItemDate';
import { ELEMENT_TYPES } from '../../constants';
import ItemLabels from '../list/ItemLabels';
import ItemLocation from '../list/ItemLocation';
import MoveDropdown from '../dropdown/MoveDropdown';
import LabelDropdown from '../dropdown/LabelDropdown';
import MessageHeaderExtra from './MessageHeaderExtra';
import MessageLock from './MessageLock';
import { isSent } from './logic/message';

const MessageHeaderExpanded = ({
    labels,
    message,
    messageLoaded,
    onLoadRemoteImages,
    onLoadEmbeddedImages,
    mailSettings,
    showDetails,
    toggleDetails
}) => {
    const { Name, Address } = message.data.Sender;
    const { ToList = [], CCList = [], BCCList = [] } = message.data;
    const recipients = [...ToList, ...BCCList, ...CCList];
    const inOutClass = isSent(message.data) ? 'is-outbound' : 'is-inbound';

    return (
        <div className={`message-header ${inOutClass}`}>
            <div className="flex flex-nowrap flex-items-center flex-spacebetween mb0-5">
                <div>
                    <span className="mr0-5">{c('Label').t`From:`}</span>
                    <span className="bold mr0-5" title={Name}>
                        {Name}
                    </span>
                    <i title={Address}>&lt;{Address}&gt;</i>
                    <MessageLock message={message} />
                </div>
                <div>
                    <ItemLabels max={4} element={message.data} labels={labels} type={ELEMENT_TYPES.MESSAGE} />
                    <ItemLocation message={message.data} mailSettings={mailSettings} />
                    <ItemDate element={message.data} type={ELEMENT_TYPES.MESSAGE} showDetails={showDetails} />
                    <ItemStar element={message.data} type={ELEMENT_TYPES.MESSAGE} />
                </div>
            </div>
            <div className="flex mb0-5">
                <span className="mr0-5">{c('Label').t`To:`}</span>
                {recipients.map(({ Address = '', Name = '' }, index) => {
                    return (
                        <span key={Address} className="mr0-5" title={Address}>
                            {Name || Address}
                            {index < recipients.length - 1 && ','}
                        </span>
                    );
                })}
            </div>
            {showDetails ? (
                <div className="mb0-5">
                    <span className="mr0-5">{c('Label').t`Size:`}</span>
                    <span>{message.data.Size}</span>
                </div>
            ) : null}
            <MessageHeaderExtra
                message={message}
                onLoadRemoteImages={onLoadRemoteImages}
                onLoadEmbeddedImages={onLoadEmbeddedImages}
            />
            <div className="flex flex-spacebetween mb1 flex-nowrap">
                <a onClick={toggleDetails} className="bold flex-self-vcenter">
                    {showDetails ? c('Action').t`Hide details` : c('Action').t`Show details`}
                </a>
                <div>
                    <Group className="mr1">
                        <SimpleDropdown autoClose={false} content={<Icon name="folder" />}>
                            <MoveDropdown selectedIDs={[message.data.ID]} type={ELEMENT_TYPES.MESSAGE} />
                        </SimpleDropdown>
                        <SimpleDropdown autoClose={false} content={<Icon name="label" />}>
                            <LabelDropdown selectedIDs={[message.data.ID]} type={ELEMENT_TYPES.MESSAGE} />
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

MessageHeaderExpanded.propTypes = {
    labels: PropTypes.array,
    mailSettings: PropTypes.object.isRequired,
    message: PropTypes.object.isRequired,
    messageLoaded: PropTypes.bool.isRequired,
    onLoadRemoteImages: PropTypes.func.isRequired,
    onLoadEmbeddedImages: PropTypes.func.isRequired,
    showDetails: PropTypes.bool.isRequired,
    toggleDetails: PropTypes.func.isRequired
};

export default MessageHeaderExpanded;
