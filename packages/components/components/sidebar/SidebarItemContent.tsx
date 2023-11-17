import { ReactNode } from 'react';

import Icon, { IconName, IconSize } from '../icon/Icon';

interface Props {
    icon?: IconName;
    iconColor?: string;
    iconSize?: IconSize;
    text?: ReactNode;
    title?: string;
    aside?: ReactNode;
}

const SidebarItemContent = ({ icon, iconColor, iconSize = 16, title, text, aside }: Props) => {
    return (
        <span className="flex flex-nowrap w-full items-center gap-2" title={title}>
            {icon && (
                <Icon
                    color={iconColor}
                    name={icon}
                    size={iconSize}
                    className="navigation-icon flex-item-noshrink flex-item-centered-vert"
                />
            )}
            <span className="flex-item-fluid text-ellipsis max-w-full">{text}</span>
            {aside && <span className="flex items-center">{aside}</span>}
        </span>
    );
};

export default SidebarItemContent;
