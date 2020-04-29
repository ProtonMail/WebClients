import React from 'react';
import { Link } from 'react-router-dom';
import { Icon, useFolders } from 'react-components';
import { MailSettings } from 'proton-shared/lib/interfaces';
import { SHOW_MOVED, MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { hasBit } from 'proton-shared/lib/helpers/bitset';

import { Message } from '../../models/message';
import { getStandardFolders } from '../../helpers/labels';
import { getLabelIDs } from '../../helpers/elements';
import { toMap } from 'proton-shared/lib/helpers/object';

interface Props {
    message?: Message;
    mailSettings: MailSettings;
}

const { SENT, DRAFTS, ALL_SENT, ALL_DRAFTS } = MAILBOX_LABEL_IDS;

const ItemLocation = ({ message = {}, mailSettings }: Props) => {
    const { ShowMoved } = mailSettings;
    const labelIDs = getLabelIDs(message);
    const standardFolders = getStandardFolders();
    const [customFoldersList] = useFolders();
    const customFolders = toMap(customFoldersList, 'ID');

    const icons = labelIDs
        .filter((labelID) => {
            if ([SENT, ALL_SENT].includes(labelID as MAILBOX_LABEL_IDS)) {
                return (hasBit(ShowMoved, SHOW_MOVED.SENT) ? ALL_SENT : SENT) === labelID;
            }
            if ([DRAFTS, ALL_DRAFTS].includes(labelID as MAILBOX_LABEL_IDS)) {
                return (hasBit(ShowMoved, SHOW_MOVED.DRAFTS) ? ALL_DRAFTS : DRAFTS) === labelID;
            }
            return true;
        })
        .filter((labelID) => standardFolders[labelID] || customFolders[labelID])
        .map((labelID) => {
            if (standardFolders[labelID]) {
                return standardFolders[labelID];
            }
            const folder = customFolders[labelID];
            return {
                icon: 'folder',
                name: folder?.Name,
                to: `/${folder?.ID}`,
                color: folder?.Color
            };
        });

    return (
        <>
            {icons.map(({ icon, name, to, color }) => (
                <Link key={to} to={to} className="mr0-25 flex-item-noshrink" title={name}>
                    <Icon name={icon} color={color} />
                </Link>
            ))}
        </>
    );
};

export default ItemLocation;
