import React from 'react';
import { classnames, Href, Icon, Loader, Tooltip } from 'react-components';
import { getSendIconHref, getStatusIconName } from '../../helpers/message/icon';
import { StatusIcon } from '../../models/crypto';

interface Props extends Partial<StatusIcon> {
    loading?: boolean;
    useTooltip?: boolean;
    className?: string;
}

const EncryptionStatusIcon = ({
    colorClassName,
    isEncrypted,
    fill,
    text,
    loading,
    useTooltip = true,
    className
}: Props) => {
    if (loading) {
        return <Loader className="icon-16p mauto flex" />;
    }

    const href = getSendIconHref({ isEncrypted, fill });
    const iconName = getStatusIconName({ isEncrypted, fill });

    const icon = (
        <Href href={href} className="flex flex-item-noshrink mauto">
            <Icon
                viewBox={iconName === 'circle' ? '0 0 16 16' : '0 0 18 18'}
                size={16}
                name={iconName}
                className={colorClassName}
                alt={text || ''}
            />
        </Href>
    );

    if (useTooltip) {
        return (
            <Tooltip
                title={text || ''}
                className={classnames(['inline-flex flex-item-noshrink alignmiddle', className])}
            >
                {icon}
            </Tooltip>
        );
    }

    return icon;
};

export default EncryptionStatusIcon;
