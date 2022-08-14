import { HTMLAttributes, ReactNode } from 'react';

import { IconName } from '../icon';

interface Props extends HTMLAttributes<HTMLSpanElement> {
    icon?: IconName;
    iconColor?: string;
    children?: ReactNode;
    title?: string;
    left?: ReactNode;
    right?: ReactNode;
}

const SidebarListItemContent = ({ left, right, children, ...rest }: Props) => {
    return (
        <span className="flex flex-nowrap w100 flex-align-items-center" {...rest}>
            {left}
            <span className="flex-item-fluid max-w100 flex flex-align-items-center flex-nowrap">{children}</span>
            {right && <span className="flex flex-align-items-center">{right}</span>}
        </span>
    );
};

export default SidebarListItemContent;
