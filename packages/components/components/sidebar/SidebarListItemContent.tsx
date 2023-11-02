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
        <span className="flex flex-nowrap w-full flex-align-items-center gap-2" {...rest}>
            {left}
            <span className="flex-item-fluid max-w-full flex flex-align-items-center flex-nowrap gap-2">{children}</span>
            {right && <span className="flex-no-min-children flex-align-items-center">{right}</span>}
        </span>
    );
};

export default SidebarListItemContent;
