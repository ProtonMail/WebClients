import { ReactElement, ReactNode } from 'react';

import { Icon, IconName, Label } from '@proton/components';

import { Tooltip } from '../tooltip';

export interface IconRowProps {
    className?: string;
    children: ReactNode;
    icon?: ReactElement | IconName;
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
    labelClassName = 'pb-2',
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
        <div className="flex flex-nowrap items-start mb-4 form--icon-labels">
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
