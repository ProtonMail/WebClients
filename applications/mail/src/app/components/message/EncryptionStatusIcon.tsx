import React from 'react';
import { Href, Icon, Loader, Tooltip } from 'react-components';
import { getStatusIconHref, getStatusIconName } from '../../helpers/send/icon';
import { StatusIcon } from '../../models/crypto';

interface Props extends Partial<StatusIcon> {
    isComposing?: boolean;
    isReceived?: boolean;
    isSent?: boolean;
    loading?: boolean;
}

const EncryptionStatusIcon = ({ colorClassName, isEncrypted, fill, text, loading }: Props) => {
    if (loading) {
        return <Loader className="icon-18p mauto flex" />;
    }

    const href = getStatusIconHref({ isEncrypted, fill });
    const iconName = getStatusIconName({ isEncrypted, fill });

    return (
        <Tooltip title={text || ''} className="inline-flex mauto alignmiddle">
            <Href href={href} className="flex mauto">
                <Icon
                    viewBox={iconName === 'circle' ? '0 0 16 16' : '0 0 18 18'}
                    size={18}
                    name={iconName}
                    className={colorClassName}
                />
            </Href>
        </Tooltip>
    );
};

export default EncryptionStatusIcon;
