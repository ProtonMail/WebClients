import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from 'react-components';
import { MAILBOX_LABEL_IDS, SHOW_MOVED } from 'proton-shared/lib/constants';
import { c } from 'ttag';

import { LABEL_IDS_TO_HUMAN } from '../../constants';
import { Message } from '../../models/message';
import { MailSettings } from '../../models/utils';

const { INBOX, TRASH, SPAM, ARCHIVE, SENT, DRAFTS } = MAILBOX_LABEL_IDS;

interface FolderMap {
    [id: string]: {
        icon: string;
        name: string;
        to: string;
    };
}

const getFolders = ({ ShowMoved }: MailSettings): FolderMap => ({
    [INBOX]: {
        icon: 'inbox',
        name: c('Mailbox').t`Inbox`,
        to: '/inbox'
    },
    [TRASH]: {
        icon: 'trash',
        name: c('Mailbox').t`Trash`,
        to: '/trash'
    },
    [SPAM]: {
        icon: 'spam',
        name: c('Mailbox').t`Spam`,
        to: '/spam'
    },
    [ARCHIVE]: {
        icon: 'archive',
        name: c('Mailbox').t`Archive`,
        to: '/archive'
    },
    [SENT]: {
        icon: 'sent',
        name: c('Mailbox').t`Sent`,
        to:
            ShowMoved & SHOW_MOVED.SENT
                ? `/${LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.ALL_SENT]}`
                : `/${LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.SENT]}`
    },
    [DRAFTS]: {
        icon: 'drafts',
        name: c('Mailbox').t`Drafts`,
        to:
            ShowMoved & SHOW_MOVED.DRAFTS
                ? `/${LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.ALL_DRAFTS]}`
                : `/${LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.DRAFTS]}`
    }
});

interface Props {
    message?: Message;
    mailSettings: MailSettings;
}

const ItemLocation = ({ message = {}, mailSettings }: Props) => {
    const { LabelIDs = [] } = message;
    const folders = getFolders(mailSettings);

    return (
        <>
            {LabelIDs.filter((labelID) => folders[labelID]).map((labelID) => {
                const { icon, name, to } = folders[labelID];
                return (
                    <Link to={to} className="mr0-25 flex-item-noshrink" key={labelID} title={name}>
                        <Icon name={icon} />
                    </Link>
                );
            })}
        </>
    );
};

export default ItemLocation;
