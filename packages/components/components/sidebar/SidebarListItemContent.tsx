import React, { ReactNode } from 'react';

interface Props extends React.HTMLAttributes<HTMLSpanElement> {
    icon?: string;
    iconColor?: string;
    children?: ReactNode;
    title?: string;
    left?: ReactNode;
    right?: ReactNode;
}

const SidebarListItemContent = ({ left, right, children, ...rest }: Props) => {
    return (
        <span className="flex flex-nowrap w100 flex-items-center" {...rest}>
            {left}
            <span className="flex-item-fluid ellipsis mw100">{children}</span>
            {right && <span className="flex flex-items-center">{right}</span>}
        </span>
    );
};

export default SidebarListItemContent;
