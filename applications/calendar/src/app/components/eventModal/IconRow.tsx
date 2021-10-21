import { Label, Icon } from '@proton/components';
import { memo } from 'react';
import * as React from 'react';

interface Props {
    className?: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
    iconColor?: string;
    iconClassName?: string;
    title?: string;
    id?: string;
}
const IconRow = ({ children, icon, iconColor, className, title, iconClassName, id }: Props) => {
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
            <Label className="pb0-5" htmlFor={id} title={title}>
                {getIcon()}
            </Label>
            <div className={className || 'flex-item-fluid'}>{children}</div>
        </div>
    );
};

export default memo(IconRow);
