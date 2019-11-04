import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { LinkButton, useToggle, SimpleDropdown, Icon, Group, ButtonGroup, Loader } from 'react-components';

import ItemStar from '../list/ItemStar';
import ItemDate from '../list/ItemDate';
import { ELEMENT_TYPES } from '../../constants';
import MessageBody from './MessageBody';
import ItemLabels from '../list/ItemLabels';
import ItemLocation from '../list/ItemLocation';
import MoveDropdown from '../dropdown/MoveDropdown';
import LabelDropdown from '../dropdown/LabelDropdown';

const MessageView = ({ labels, message, onExpand, mailSettings }) => {
    const { state, toggle } = useToggle();
    const { ToList = [], CCList = [], BCCList = [] } = message;
    const recipients = [...ToList, ...BCCList, ...CCList];

    if (!message.expanded) {
        return (
            <article
                className="bg-global-light bordered-container pl1 pr1 pt0-5 pb0-5 mb1 flex flex-nowrap flex-items-center flex-spacebetween"
                onClick={(event) => {
                    if (event.target.classList.contains('item-star') || event.target.closest('.item-star')) {
                        event.stopPropagation();
                        return;
                    }
                    onExpand(message.ID);
                }}
            >
                <div>
                    <span className="mr0-5">{c('Label').t`From:`}</span>
                    <span className="bold mr0-5" title={message.Sender.Name}>
                        {message.Sender.Name}
                    </span>
                    <i title={message.Sender.Address}>&lt;{message.Sender.Address}&gt;</i>
                </div>
                <div>
                    <ItemDate className="mr1" element={message} type={ELEMENT_TYPES.MESSAGE} />
                    <ItemStar element={message} type={ELEMENT_TYPES.MESSAGE} />
                </div>
            </article>
        );
    }

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
                        <ItemDate element={message} type={ELEMENT_TYPES.MESSAGE} showDetails={state} />
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
                {state ? (
                    <div className="mb0-5">
                        <span className="mr0-5">{c('Label').t`Size:`}</span>
                        <span>{message.Size}</span>
                    </div>
                ) : null}
                <div className="flex flex-spacebetween">
                    <LinkButton onClick={toggle}>
                        {state ? c('Action').t`Hide details` : c('Action').t`Show details`}
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
            </div>
            {message.loading ? <Loader /> : <MessageBody message={message} />}
        </article>
    );
};

MessageView.propTypes = {
    labels: PropTypes.array,
    mailSettings: PropTypes.object.isRequired,
    message: PropTypes.object.isRequired,
    onExpand: PropTypes.func
};

export default MessageView;
