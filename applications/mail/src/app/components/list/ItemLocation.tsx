import React from 'react';
import { Link } from 'react-router-dom';
import { Icon, useFolders } from 'react-components';
import { MailSettings } from 'proton-shared/lib/interfaces';

import { Message } from '../../models/message';
import { getStandardFolders } from '../../helpers/labels';
import { getLabelIDs } from '../../helpers/elements';
import { toMap } from 'proton-shared/lib/helpers/object';

interface Props {
    message?: Message;
    mailSettings: MailSettings;
}

const ItemLocation = ({ message = {}, mailSettings }: Props) => {
    const labelIDs = getLabelIDs(message);
    const standardFolders = getStandardFolders(mailSettings);
    const [customFoldersList] = useFolders();
    const customFolders = toMap(customFoldersList, 'ID');

    const icons = labelIDs
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
