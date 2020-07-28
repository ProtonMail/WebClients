import { Label, Icon } from 'react-components';
import React, { memo } from 'react';

interface Props {
    className?: string;
    children: React.ReactNode;
    icon?: string;
    iconColor?: string;
    title?: string;
    id?: string;
}
const IconRow = ({ children, icon, iconColor, className, title, id }: Props) => (
    <div className="flex flex-nowrap item mb1 pm-form--iconLabels">
        <Label htmlFor={id} title={title}>
            {icon && <Icon name={icon} alt={title} color={iconColor} />}
        </Label>
        <div className={className || 'flex-item-fluid'}>{children}</div>
    </div>
);

export default memo(IconRow);
