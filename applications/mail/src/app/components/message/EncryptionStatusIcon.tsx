import { classnames, Href, Icon, Loader, Tooltip } from '@proton/components';
import { getSendIconHref, getStatusIconName } from '../../helpers/message/icon';
import { StatusIcon } from '../../models/crypto';

interface Props extends Partial<StatusIcon> {
    loading?: boolean;
    disabled?: boolean;
    useTooltip?: boolean;
    className?: string;
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

    return (
        <Tooltip title={tooltip}>
            <span className={classnames(['inline-flex flex-item-noshrink align-middle', className])}>
                <Href href={href} className="flex flex-item-noshrink mauto" tabIndex={disabled ? -1 : undefined}>
                    <Icon
                        size={16}
                        name={iconName}
                        className={colorClassName}
                        alt={text || ''}
                        data-testid="encryption-icon"
                    />
                </Href>
            </span>
        </Tooltip>
    );
};

export default EncryptionStatusIcon;
