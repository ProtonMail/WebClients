import React, { ReactNode } from 'react';

import Icon from '../icon/Icon';

interface Props {
    icon?: string;
    iconColor?: string;
    iconSize?: number;
    text?: ReactNode;
    title?: string;
    aside?: ReactNode;
}

const SidebarItemContent = ({ icon, iconColor, iconSize = 16, title, text, aside }: Props) => {
    return (
        <span className="flex flex-nowrap w100 flex-items-center" title={title}>
            {icon && (
                <Icon
                    color={iconColor}
                    name={icon}
                    size={iconSize}
                    className="navigation__icon flex-item-noshrink mr0-5 flex-item-centered-vert"
                />
            )}
            <span className="flex-item-fluid ellipsis mw100">{text}</span>
            {aside && <span className="flex flex-items-center">{aside}</span>}
        </span>
    );
};

export default SidebarItemContent;
