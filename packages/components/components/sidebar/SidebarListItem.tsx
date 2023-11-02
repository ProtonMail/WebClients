import { LiHTMLAttributes } from 'react';

import clsx from '@proton/utils/clsx';

interface Props extends LiHTMLAttributes<HTMLLIElement> {
    itemClassName?: string;
}

const SidebarListItem = ({
    className = '',
    itemClassName = 'navigation-item w-full px-3 mb-0.5',
    children,
    ...rest
}: Props) => {
    return (
        <li className={clsx([itemClassName, className])} {...rest}>
            {children}
        </li>
    );
};

export const SubSidebarListItem = (props: Props) => {
    return <SidebarListItem itemClassName="navigation-subitem" {...props} />;
};

export default SidebarListItem;
