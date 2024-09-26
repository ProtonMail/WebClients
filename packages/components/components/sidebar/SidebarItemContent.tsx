import type { ReactNode } from 'react';

import Icon from '@proton/components/components/icon/Icon';

import type { IconName, IconSize } from '../icon/Icon';

interface Props {
    icon?: IconName;
    iconColor?: string;
    iconSize?: IconSize;
    text?: ReactNode;
    title?: string;
    aside?: ReactNode;
}

const SidebarItemContent = ({ icon, iconColor, iconSize = 4, title, text, aside }: Props) => {
    return (
        <span className="flex flex-nowrap w-full items-center gap-2" title={title}>
            {icon && (
                <Icon
                    color={iconColor}
                    name={icon}
                    size={iconSize}
                    className="navigation-icon shrink-0 self-center my-auto"
                />
            )}
            <span className="flex-1 text-ellipsis max-w-full">{text}</span>
            {aside && <span className="flex items-center">{aside}</span>}
        </span>
    );
};

export default SidebarItemContent;
