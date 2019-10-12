import React, { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
    Button,
    useUser,
    useModals,
    LinkButton,
    AuthenticatedBugModal,
    useConversationCounts,
    useMessageCounts
} from 'react-components';
import { c, ngettext, msgid } from 'ttag';
import { toMap } from 'proton-shared/lib/helpers/object';
import { capitalize } from 'proton-shared/lib/helpers/string';

import conversationSingleSvg from 'design-system/assets/img/shared/selected-conversation-single.svg';
import conversationManySvg from 'design-system/assets/img/shared/selected-conversation-many.svg';
import welcomeMessageSvg from 'design-system/assets/img/shared/welcome-message.svg';
import { getCurrentType } from '../../helpers/element';
import { ELEMENT_TYPES } from '../../constants';

const PlaceholderView = ({ labelID = '', checkedIDs = [], onUncheckAll, welcomeRef, mailSettings }) => {
    const total = checkedIDs.length;
    const [conversationCounts] = useConversationCounts();
    const [messageCounts] = useMessageCounts();
    const [user] = useUser();
    const { createModal } = useModals();
    const type = getCurrentType({ mailSettings, labelID });

    const unreadMap = useMemo(() => {
        const counters = type === ELEMENT_TYPES.CONVERSATION ? conversationCounts : messageCounts;

        if (!Array.isArray(counters)) {
            return {};
        }

        return toMap(counters, 'LabelID');
    }, [conversationCounts, messageCounts]);

    const { Unread = 0 } = unreadMap[labelID] || {};

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

    const reportBugButton = (
        <LinkButton key="report-bug-btn" onClick={() => createModal(<AuthenticatedBugModal />)}>{c('Action')
            .t`report a bug`}</LinkButton>
    );

    return (
        <div className="flex-item-fluid aligncenter p3">
            <h2>{user.Name ? c('Title').t`Welcome, ${capitalize(user.Name)}!` : c('Title').t`Welcome`}</h2>
            {Unread ? (
                <p>
                    {ngettext(
                        msgid`You have 1 unread email in this folder`,
                        `You have ${Unread} unread emails in this folder`,
                        Unread
                    )}
                </p>
            ) : null}
            {user.hadPaidMail ? (
                <>
                    <p>{c('Info')
                        .jt`Having trouble sending or receiving emails? Interested in helping us improve our service? Feel free to ${reportBugButton}.`}</p>
                    <img src={welcomeMessageSvg} alt={c('Alternative text for welcome image').t`Welcome`} />
                </>
            ) : (
                <>
                    <p>{c('Info')
                        .t`Upgrade to a paid plan starting from $4/month only and get additional storage capacity and more addresses with ProtonMail Plus.`}</p>
                </>
            )}
        </div>
    );
};

PlaceholderView.propTypes = {
    labelID: PropTypes.string.isRequired,
    checkedIDs: PropTypes.array,
    onUncheckAll: PropTypes.func,
    welcomeRef: PropTypes.object,
    mailSettings: PropTypes.object.isRequired
};

export default PlaceholderView;
