import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { LinkButton, SimpleDropdown, Icon, Group, ButtonGroup } from 'react-components';

import ItemStar from '../list/ItemStar';
import ItemDate from '../list/ItemDate';
import { ELEMENT_TYPES } from '../../constants';
import ItemLabels from '../list/ItemLabels';
import ItemLocation from '../list/ItemLocation';
import MoveDropdown from '../dropdown/MoveDropdown';
import LabelDropdown from '../dropdown/LabelDropdown';
import MessageHeaderExtra from './MessageHeaderExtra';

const MessageHeaderExpanded = ({
    labels,
    message,
    messageMetadata,
    onLoadImages,
    mailSettings,
    showDetails,
    toggleDetails,
    children
}) => {
    const { ToList = [], CCList = [], BCCList = [] } = message;
    const recipients = [...ToList, ...BCCList, ...CCList];

    return (
        <article className="bordered-container mb1">
            <div className="bg-global-light p1">
                <div className="flex flex-nowrap flex-items-center flex-spacebetween mb0-5">
                    <div>
                        <span className="mr0-5">{c('Label').t`From:`}</span>
                        <span className="bold mr0-5" title={message.Sender.Name}>
                            {message.Sender.Name}
                        </span>
                        <i title={message.Sender.Address}>&lt;{message.Sender.Address}&gt;</i>
                    </div>
                    <div>
                        <ItemLabels max={4} element={message} labels={labels} type={ELEMENT_TYPES.MESSAGE} />
                        <ItemLocation message={message} mailSettings={mailSettings} />
                        <ItemDate element={message} type={ELEMENT_TYPES.MESSAGE} showDetails={showDetails} />
                        <ItemStar element={message} type={ELEMENT_TYPES.MESSAGE} />
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
                        <span>{message.Size}</span>
                    </div>
                ) : null}
                <div className="flex flex-spacebetween">
                    <LinkButton onClick={toggleDetails}>
                        {showDetails ? c('Action').t`Hide details` : c('Action').t`Show details`}
                    </LinkButton>
                    <div>
                        <SimpleDropdown autoClose={false} content={<Icon name="folder" />}>
                            <MoveDropdown selectedIDs={[message.ID]} type={ELEMENT_TYPES.MESSAGE} />
                        </SimpleDropdown>
                        <SimpleDropdown autoClose={false} content={<Icon name="label" />}>
                            <LabelDropdown selectedIDs={[message.ID]} type={ELEMENT_TYPES.MESSAGE} />
                        </SimpleDropdown>
                        <Group>
                            <ButtonGroup disabled={message.loading}>
                                <Icon name="reply" />
                            </ButtonGroup>
                            <ButtonGroup disabled={message.loading}>
                                <Icon name="reply-all" />
                            </ButtonGroup>
                            <ButtonGroup disabled={message.loading}>
                                <Icon name="forward" />
                            </ButtonGroup>
                        </Group>
                    </div>
                </div>
                <MessageHeaderExtra message={message} messageMetadata={messageMetadata} onLoadImages={onLoadImages} />
            </div>
            {children}
        </article>
    );
};

MessageHeaderExpanded.propTypes = {
    labels: PropTypes.array,
    mailSettings: PropTypes.object.isRequired,
    message: PropTypes.object.isRequired,
    messageMetadata: PropTypes.object.isRequired,
    onLoadImages: PropTypes.func.isRequired,
    showDetails: PropTypes.bool.isRequired,
    toggleDetails: PropTypes.func.isRequired,
    children: PropTypes.node
};

export default MessageHeaderExpanded;
