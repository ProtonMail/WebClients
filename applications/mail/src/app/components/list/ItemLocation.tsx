import React from 'react';
import { Icon, useFolders } from 'react-components';
import { MailSettings } from 'proton-shared/lib/interfaces';

import { Message } from '../../models/message';
import { getCurrentFolders } from '../../helpers/labels';

interface Props {
    message?: Message;
    mailSettings: MailSettings;
}

const ItemLocation = ({ message, mailSettings }: Props) => {
    const [customFolders = []] = useFolders();
    const infos = getCurrentFolders(message, customFolders, mailSettings);

    return (
        <>
            {infos.map(({ icon, name, to, color }) => (
                <span className="inline-flex flex-item-noshrink" key={to} title={name}>
                    <Icon name={icon} color={color} />
                </span>
            ))}
        </>
    );
};

export default ItemLocation;
