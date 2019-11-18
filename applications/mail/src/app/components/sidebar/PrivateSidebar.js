import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
    NavMenu,
    MainLogo,
    Loader,
    useMailSettings,
    useLabels,
    useConversationCounts,
    useMessageCounts,
    PrimaryButton
} from 'react-components';
import { SHOW_MOVED, LABEL_EXCLUSIVE, MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { redirectTo } from 'proton-shared/lib/helpers/browser';
import { toMap } from 'proton-shared/lib/helpers/object';
import { c } from 'ttag';

import LocationAside from './LocationAside';
import RefreshButton from './RefreshButton';
import { LABEL_IDS_TO_HUMAN, ELEMENT_TYPES } from '../../constants';
import { getCurrentType } from '../../helpers/elements';

const PrivateSidebar = ({ expanded = false, labelID: currentLabelID }) => {
    const [conversationCounts, loadingConversationCounts] = useConversationCounts();
    const [messageCounts, loadingMessageCounts] = useMessageCounts();
    const [mailSettings, loadingMailSettings] = useMailSettings();
    const [labels, loadingLabels] = useLabels();
    const { ShowMoved } = mailSettings || {};
    const type = getCurrentType({ mailSettings, labelID: currentLabelID });

    const unreadMap = useMemo(() => {
        const counters = type === ELEMENT_TYPES.CONVERSATION ? conversationCounts : messageCounts;

        if (!Array.isArray(counters)) {
            return {};
        }

        return toMap(counters, 'LabelID');
    }, [conversationCounts, messageCounts]);

    if (loadingMailSettings || loadingLabels || loadingConversationCounts || loadingMessageCounts) {
        return <Loader />;
    }

    const getAside = (labelID) => {
        return (
            <LocationAside
                unread={unreadMap[labelID].Unread}
                action={labelID === currentLabelID ? <RefreshButton /> : null}
            />
        );
    };

    const list = [
        {
            icon: 'inbox',
            text: c('Link').t`Inbox`,
            aside: getAside(MAILBOX_LABEL_IDS.INBOX),
            link: `/${LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.INBOX]}`
        },
        {
            icon: 'drafts',
            text: c('Link').t`Drafts`,
            aside: getAside(ShowMoved & SHOW_MOVED.DRAFTS ? MAILBOX_LABEL_IDS.ALL_DRAFTS : MAILBOX_LABEL_IDS.DRAFTS),
            link:
                ShowMoved & SHOW_MOVED.DRAFTS
                    ? `/${LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.ALL_DRAFTS]}`
                    : `/${LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.DRAFTS]}`
        },
        {
            icon: 'sent',
            text: c('Link').t`Sent`,
            aside: getAside(ShowMoved & SHOW_MOVED.SENT ? MAILBOX_LABEL_IDS.ALL_SENT : MAILBOX_LABEL_IDS.SENT),
            link:
                ShowMoved & SHOW_MOVED.SENT
                    ? `/${LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.ALL_SENT]}`
                    : `/${LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.SENT]}`
        },
        {
            icon: 'star',
            text: c('Link').t`Starred`,
            aside: getAside(MAILBOX_LABEL_IDS.STARRED),
            link: `/${LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.STARRED]}`
        },
        {
            icon: 'archive',
            text: c('Link').t`Archive`,
            aside: getAside(MAILBOX_LABEL_IDS.ARCHIVE),
            link: `/${LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.ARCHIVE]}`
        },
        {
            icon: 'spam',
            text: c('Link').t`Spam`,
            aside: getAside(MAILBOX_LABEL_IDS.SPAM),
            link: `/${LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.SPAM]}`
        },
        {
            icon: 'trash',
            text: c('Link').t`Trash`,
            aside: getAside(MAILBOX_LABEL_IDS.TRASH),
            link: `/${LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.TRASH]}`
        },
        {
            icon: 'all-emails',
            text: c('Link').t`All mail`,
            aside: getAside(MAILBOX_LABEL_IDS.ALL_MAIL),
            link: `/${LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.ALL_MAIL]}`
        },
        {
            icon: 'folder-label',
            text: c('Link').t`Folders/labels`,
            className: 'alignleft',
            type: 'button',
            onClick() {
                redirectTo('/settings/labels');
            }
        },
        ...labels.map(({ ID, Name, Exclusive, Color }) => ({
            icon: Exclusive === LABEL_EXCLUSIVE.LABEL ? 'label' : 'folder',
            text: Name,
            aside: getAside(ID),
            link: `/${ID}`,
            color: Color
        }))
    ];

    return (
        <div className="sidebar flex flex-column noprint" data-expanded={expanded}>
            <div className="nodesktop notablet">
                <MainLogo url="/inbox" />
            </div>
            <div className="pl1 pr1">
                <PrimaryButton className="w100 bold">{c('Action').t`Compose`}</PrimaryButton>
            </div>
            <nav className="navigation mw100 flex-item-fluid scroll-if-needed mb1">
                <NavMenu list={list} />
            </nav>
        </div>
    );
};

PrivateSidebar.propTypes = {
    labelID: PropTypes.string.isRequired,
    expanded: PropTypes.bool
};

export default PrivateSidebar;
