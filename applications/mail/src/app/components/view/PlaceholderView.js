import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, useUser, useModals, LinkButton, AuthenticatedBugModal } from 'react-components';
import { c, ngettext, msgid } from 'ttag';
import conversationSingleSvg from 'design-system/assets/img/shared/selected-conversation-single.svg';
import conversationManySvg from 'design-system/assets/img/shared/selected-conversation-many.svg';
import welcomeMessageSvg from 'design-system/assets/img/shared/welcome-message.svg';

const PlaceholderView = ({ checkedIDs = [], onUncheckAll, welcomeRef }) => {
    const total = checkedIDs.length;
    const unread = 4;
    const [user] = useUser();
    const { createModal } = useModals();

    useEffect(() => {
        return () => {
            welcomeRef.current = true;
        };
    }, []);

    if (welcomeRef.current) {
        return (
            <div className="flex-item-fluid aligncenter p3">
                <p className="mb2">
                    {ngettext(
                        msgid`You selected 1 element from this folder`,
                        `You selected ${total} elements from this folder`,
                        total
                    )}
                </p>
                <div className="mb2">
                    <img
                        src={checkedIDs.length > 1 ? conversationManySvg : conversationSingleSvg}
                        alt={c('Alternative text for conversation image').t`Conversation`}
                    />
                </div>
                {checkedIDs.length ? <Button onClick={onUncheckAll}>{c('Action').t`Deselect`}</Button> : null}
            </div>
        );
    }

    if (user.hasPaidMail) {
        const reportBugButton = (
            <LinkButton key="report-bug-btn" onClick={() => createModal(<AuthenticatedBugModal />)}>{c('Action')
                .t`report a bug`}</LinkButton>
        );
        return (
            <div className="flex-item-fluid aligncenter p3">
                <h3>{c('Title').t`Welcome, ${user.Name}!`}</h3>
                <p>
                    {ngettext(
                        msgid`You have 1 unread email in this folder`,
                        `You have ${unread} unread emails in this folder`,
                        unread
                    )}
                </p>
                <p>{c('Info')
                    .jt`Having trouble sending or receiving emails? Interested in helping us improve our service? Feel free to ${reportBugButton}.`}</p>
                <img src={welcomeMessageSvg} alt={c('Alternative text for welcome image').t`Welcome`} />
            </div>
        );
    }

    return (
        <div className="flex-item-fluid aligncenter p3">
            <h3>{c('Title').t`Welcome, ${user.Name}!`}</h3>
            <p>
                {ngettext(
                    msgid`You have 1 unread email in this folder`,
                    `You have ${unread} unread emails in this folder`,
                    unread
                )}
            </p>
            <p>{c('Info').t`Upgrade to a paid plan and get additional storage capacity and more addresses.`}</p>
        </div>
    );
};

PlaceholderView.propTypes = {
    checkedIDs: PropTypes.array,
    onUncheckAll: PropTypes.func,
    welcomeRef: PropTypes.object
};

export default PlaceholderView;
