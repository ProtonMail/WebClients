import React from 'react';
import { Href, Icon, Tooltip, LoaderIcon } from 'react-components';
import { getStatusIconName, getStatusIconHref } from '../../helpers/send/icon';

export enum StatusIconFills {
    PLAIN = 0,
    CHECKMARK = 1,
    SIGN = 2,
    WARNING = 3
}

export interface StatusIcon {
    colorClassName: string;
    isEncrypted: boolean;
    fill: StatusIconFills;
    text: string;
}

export interface MapStatusIcon {
    [key: string]: StatusIcon | undefined;
}

interface Props extends Partial<StatusIcon> {
    isComposing?: boolean;
    isReceived?: boolean;
    isSent?: boolean;
    loading?: boolean;
}

const EncryptionStatusIcon = ({ colorClassName, isEncrypted, fill, text, loading }: Props) => {
    if (loading) {
        return <LoaderIcon />;
    }

    const href = getStatusIconHref({ isEncrypted, fill });
    const iconName = getStatusIconName({ isEncrypted, fill });

    return (
        <Tooltip title={text || ''} className="inbl">
            <Href href={href}>
                <Icon viewBox="0 0 18 18" size={18} name={iconName} className={colorClassName} />
            </Href>
        </Tooltip>
    );
};

export default EncryptionStatusIcon;
