import { ReactNode } from 'react';

import { Label, Icon } from '@proton/components';

import { Tooltip } from '../tooltip';

export interface IconRowProps {
    className?: string;
    children: ReactNode;
    icon?: ReactNode;
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
        if (!title && !icon) {
            return null;
        }

        if (!icon) {
            return (
                <>
                    &nbsp;<span className="sr-only">{title}</span>
                </>
            );
        }

        if (typeof icon === 'string') {
            return <Icon name={icon} className={iconClassName} alt={title} color={iconColor} />;
        }

        return <span>{icon}</span>;
    };

    const iconResult = getIcon();

    return (
        <div className="flex flex-nowrap flex-align-items-start mb1 form--icon-labels">
            {!!iconResult && (
                <Label className={labelClassName} htmlFor={id}>
                    <Tooltip title={title}>{iconResult}</Tooltip>
                </Label>
            )}
            <div className={className || 'flex-item-fluid'}>{children}</div>
        </div>
    );
};

export default IconRow;
