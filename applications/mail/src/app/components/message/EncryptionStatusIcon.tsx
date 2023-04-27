import { Href } from '@proton/atoms';
import { Icon, Loader, Tooltip } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { getSendIconHref, getStatusIconName } from '../../helpers/message/icon';
import { StatusIcon } from '../../models/crypto';

interface Props extends Partial<StatusIcon> {
    loading?: boolean;
    disabled?: boolean;
    useTooltip?: boolean;
    className?: string;
    isDetailsModal?: boolean;
}

const EncryptionStatusIcon = ({
    colorClassName,
    isEncrypted,
    fill,
    text,
    loading,
    /**
     * Disabled is for the case when composer is fully disabled
     */
    disabled,
    useTooltip = true,
    className,
    isDetailsModal = false,
}: Props) => {
    if (loading) {
        return <Loader className="icon-16p mauto flex" />;
    }
    if (fill === undefined && isEncrypted === undefined) {
        return null;
    }

    const href = getSendIconHref({ isEncrypted, fill });
    const iconName = getStatusIconName({ isEncrypted, fill });
    const tooltip = useTooltip ? text : undefined;

    if (isDetailsModal) {
        return (
            <span className={clsx(['inline-flex flex-item-noshrink align-middle', className])}>
                {iconName && (
                    <Icon
                        size={16}
                        name={iconName}
                        className={colorClassName}
                        alt={text || ''}
                        data-testid="encryption-icon"
                    />
                )}
            </span>
        );
    }

    const icon = iconName && (
        <Icon size={16} name={iconName} className={colorClassName} alt={text || ''} data-testid="encryption-icon" />
    );

    return (
        <Tooltip title={tooltip}>
            <span className={clsx(['inline-flex flex-item-noshrink align-middle', className])}>
                {href ? (
                    <Href href={href} className="flex flex-item-noshrink mauto" tabIndex={disabled ? -1 : undefined}>
                        {icon}
                    </Href>
                ) : (
                    icon
                )}
            </span>
        </Tooltip>
    );
};

export default EncryptionStatusIcon;
