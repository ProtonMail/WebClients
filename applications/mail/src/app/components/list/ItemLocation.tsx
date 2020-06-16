import React from 'react';
import { Icon, useFolders } from 'react-components';
import { MailSettings } from 'proton-shared/lib/interfaces';

import { Message } from '../../models/message';
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
                <span className="inline-flex flex-item-noshrink" key={to} title={name}>
                    <Icon name={icon} />
                </span>
            ))}
        </>
    );
};

export default ItemLocation;
