import type { ReactElement, ReactNode } from 'react';

import type { IconName } from '@proton/components/components/icon/Icon';
import Icon from '@proton/components/components/icon/Icon';
import Label from '@proton/components/components/label/Label';
import Tooltip from '@proton/components/components/tooltip/Tooltip';
import clsx from '@proton/utils/clsx';

export interface IconRowProps {
    className?: string;
    children: ReactNode;
    icon?: ReactElement | IconName;
    iconColor?: string;
    containerClassName?: string;
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
    containerClassName,
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
        <div className={clsx('flex flex-nowrap items-start mb-4 form--icon-labels', containerClassName)}>
            {!!iconResult && (
                <Label className={labelClassName} htmlFor={id}>
                    <Tooltip title={title}>{iconResult}</Tooltip>
                </Label>
            )}
            <div className={className || 'flex-1'}>{children}</div>
        </div>
    );
};

export default IconRow;
