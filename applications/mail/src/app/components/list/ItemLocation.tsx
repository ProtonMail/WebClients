import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import React from 'react';
import { Icon, useFolders, Tooltip } from 'react-components';
import { MailSettings } from 'proton-shared/lib/interfaces';

import { getCurrentFolders } from '../../helpers/labels';

interface Props {
    message?: Message;
    mailSettings: MailSettings;
    shouldStack?: boolean;
}

const ItemLocation = ({ message, mailSettings, shouldStack = false }: Props) => {
    const [customFolders = []] = useFolders();
    let infos = getCurrentFolders(message, customFolders, mailSettings);

    if (infos.length > 1 && shouldStack) {
        infos = [
            {
                to: infos.map((info) => info.to).join(','),
                name: infos.map((info) => info.name).join(', '),
                icon: 'parent-folder'
            }
        ];
    }

    return (
        <>
            {infos.map(({ icon, name, to }) => (
                <Tooltip title={name} key={to}>
                    <span className="flex flex-item-noshrink">
                        <Icon name={icon} alt={name} />
                    </span>
                </Tooltip>
            ))}
        </>
    );
};

export default ItemLocation;
