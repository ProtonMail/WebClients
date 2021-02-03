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
    <div className="flex flex-nowrap flex-align-items-start mb1 form--icon-labels">
        <Label className="pb0-5" htmlFor={id} title={title}>
            {icon ? (
                <Icon name={icon} alt={title} color={iconColor} />
            ) : (
                <>&nbsp;{title && <span className="sr-only">{title}</span>}</>
            )}
        </Label>
        <div className={className || 'flex-item-fluid'}>{children}</div>
    </div>
);

export default memo(IconRow);
