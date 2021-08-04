import { ReactNode } from 'react';

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
        <span className="flex flex-nowrap w100 flex-align-items-center" title={title}>
            {icon && (
                <Icon
                    color={iconColor}
                    name={icon}
                    size={iconSize}
                    className="navigation-icon flex-item-noshrink mr0-5 flex-item-centered-vert"
                />
            )}
            <span className="flex-item-fluid text-ellipsis max-w100">{text}</span>
            {aside && <span className="flex flex-align-items-center">{aside}</span>}
        </span>
    );
};

export default SidebarItemContent;
