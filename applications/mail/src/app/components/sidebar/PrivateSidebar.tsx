import React, { useMemo, useState } from 'react';
import { c } from 'ttag';
import { Location } from 'history';
import {
    NavMenu,
    MainLogo,
    Loader,
    useMailSettings,
    useLabels,
    useConversationCounts,
    useMessageCounts,
    PrimaryButton,
    useEventManager
} from 'react-components';
import { SHOW_MOVED, LABEL_EXCLUSIVE, MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { redirectTo } from 'proton-shared/lib/helpers/browser';

import LocationAside from './LocationAside';
import { LABEL_IDS_TO_HUMAN, MESSAGE_ACTIONS } from '../../constants';
import { Label } from '../../models/label';
import { OnCompose } from '../../containers/ComposerContainer';
import { getCounterMap } from '../../helpers/elements';

interface Props {
    labelID: string;
    expanded?: boolean;
    location: Location;
    onCompose: OnCompose;
}

const PrivateSidebar = ({ labelID: currentLabelID, expanded = false, location, onCompose }: Props) => {
    const [refresh, setRefresh] = useState<string>();
    const [conversationCounts, loadingConversationCounts] = useConversationCounts();
    const [messageCounts, loadingMessageCounts] = useMessageCounts();
    const [mailSettings, loadingMailSettings] = useMailSettings();
    const [labels, loadingLabels]: [Label[], boolean] = useLabels();
    const { call } = useEventManager();
    const { ShowMoved } = mailSettings || {};

    const counterMap = useMemo(() => {
        if (!mailSettings || !labels || !conversationCounts || !messageCounts) {
            return {};
        }

        return getCounterMap(labels, conversationCounts, messageCounts, mailSettings, location);
    }, [mailSettings, labels, conversationCounts, messageCounts]);

    if (loadingMailSettings || loadingLabels || loadingConversationCounts || loadingMessageCounts) {
        return <Loader />;
    }

    const getItemParams = (labelID: MAILBOX_LABEL_IDS | string) => {
        const humanID = LABEL_IDS_TO_HUMAN[labelID as MAILBOX_LABEL_IDS]
            ? LABEL_IDS_TO_HUMAN[labelID as MAILBOX_LABEL_IDS]
            : labelID;
        const link = `/${humanID}`;
        return {
            type: 'link',
            link,
            ariaCurrent: labelID === currentLabelID ? 'page' : undefined,
            aside: (
                <LocationAside
                    labelID={labelID}
                    counterMap={counterMap}
                    currentLabelID={currentLabelID}
                    refreshLabelID={refresh}
                />
            ),
            onClick: async () => {
                if (link === location.pathname) {
                    setRefresh(labelID);
                    await call();
                    setRefresh(undefined);
                }
            }
        };
    };

    const list = [
        {
            icon: 'inbox',
            text: c('Link').t`Inbox`,
            ...getItemParams(MAILBOX_LABEL_IDS.INBOX)
        },
        {
            icon: 'drafts',
            text: c('Link').t`Drafts`,
            ...getItemParams(ShowMoved & SHOW_MOVED.DRAFTS ? MAILBOX_LABEL_IDS.ALL_DRAFTS : MAILBOX_LABEL_IDS.DRAFTS)
        },
        {
            icon: 'sent',
            text: c('Link').t`Sent`,
            ...getItemParams(ShowMoved & SHOW_MOVED.SENT ? MAILBOX_LABEL_IDS.ALL_SENT : MAILBOX_LABEL_IDS.SENT)
        },
        {
            icon: 'star',
            text: c('Link').t`Starred`,
            ...getItemParams(MAILBOX_LABEL_IDS.STARRED)
        },
        {
            icon: 'archive',
            text: c('Link').t`Archive`,
            ...getItemParams(MAILBOX_LABEL_IDS.STARRED)
        },
        {
            icon: 'spam',
            text: c('Link').t`Spam`,
            ...getItemParams(MAILBOX_LABEL_IDS.SPAM)
        },
        {
            icon: 'trash',
            text: c('Link').t`Trash`,
            ...getItemParams(MAILBOX_LABEL_IDS.TRASH)
        },
        {
            icon: 'all-emails',
            text: c('Link').t`All mail`,
            ...getItemParams(MAILBOX_LABEL_IDS.ALL_MAIL)
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
        ...labels.map(({ ID = '', Name, Exclusive, Color }) => ({
            icon: Exclusive === LABEL_EXCLUSIVE.LABEL ? 'label' : 'folder',
            text: Name,
            color: Color,
            ...getItemParams(ID)
        }))
    ];

    const handleCompose = () => {
        onCompose({ action: MESSAGE_ACTIONS.NEW });
    };

    return (
        <div className="sidebar flex flex-column noprint" data-expanded={expanded}>
            <div className="nodesktop notablet">
                <MainLogo url="/inbox" />
            </div>
            <div className="pl1 pr1 mb1">
                <PrimaryButton className="w100 bold" onClick={handleCompose}>{c('Action').t`Compose`}</PrimaryButton>
            </div>
            <nav className="navigation mw100 flex-item-fluid scroll-if-needed">
                <NavMenu list={list} className="mt0" />
            </nav>
        </div>
    );
};

export default PrivateSidebar;
