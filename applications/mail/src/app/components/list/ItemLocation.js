import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Icon } from 'react-components';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { c } from 'ttag';

const { INBOX, ALL_DRAFTS, ALL_SENT, TRASH, SPAM, ARCHIVE, SENT, DRAFTS } = MAILBOX_LABEL_IDS;

const getFolders = () => ({
    [INBOX]: {
        icon: 'inbox',
        name: c('Mailbox').t`Inbox`,
        to: '/inbox'
    },
    [ALL_DRAFTS]: {
        icon: 'drafts',
        name: c('Mailbox').t`Drafts`,
        to: '/all-drafts'
    },
    [ALL_SENT]: {
        icon: 'sent',
        name: c('Mailbox').t`Sent`,
        to: '/all-sent'
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
        to: '/sent'
    },
    [DRAFTS]: {
        icon: 'drafts',
        name: c('Mailbox').t`Drafts`,
        to: '/drafts'
    }
});

const ItemLocation = ({ message }) => {
    const { LabelIDs = [] } = message;
    const folders = getFolders();

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

ItemLocation.propTypes = {
    message: PropTypes.object.isRequired
};

export default ItemLocation;
