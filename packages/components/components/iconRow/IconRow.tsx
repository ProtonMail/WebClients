import { Label, Icon } from '@proton/components';

export interface IconRowProps {
    className?: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
    iconColor?: string;
    iconClassName?: string;
    labelClassName?: string;
    title?: string;
    id?: string;
}
const IconRow = ({
    children,
    icon,
    iconColor,
    className,
    title,
    iconClassName,
    labelClassName = 'pb0-5',
    id,
}: IconRowProps) => {
    const getIcon = () => {
        if (!icon) {
            return <>&nbsp;{title && <span className="sr-only">{title}</span>}</>;
        }

        if (typeof icon === 'string') {
            return <Icon name={icon} className={iconClassName} alt={title} color={iconColor} />;
        }

        return icon;
    };

    return (
        <div className="flex flex-nowrap flex-align-items-start mb1 form--icon-labels">
            <Label className={labelClassName} htmlFor={id} title={title}>
                {getIcon()}
            </Label>
            <div className={className || 'flex-item-fluid'}>{children}</div>
        </div>
    );
};

export default IconRow;
