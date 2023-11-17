import { ComponentPropsWithoutRef, isValidElement } from 'react';

import clsx from '@proton/utils/clsx';

interface Props extends ComponentPropsWithoutRef<'li'> {
    noShrink?: boolean;
    collapsedOnDesktop?: boolean;
    noCollapse?: boolean;
}

const TopNavbarListItem = ({
    children,
    noShrink,
    collapsedOnDesktop = true,
    noCollapse = false,
    className,
    ...rest
}: Props) => {
    if (!isValidElement(children)) {
        return null;
    }
    return (
        <li
            className={clsx([
                'topnav-listItem',
                noShrink && 'shrink-0',
                !collapsedOnDesktop && 'topnav-listItem--noCollapse',
                noCollapse && 'topnav-listItem--noCollapse',
                className,
            ])}
            {...rest}
        >
            {children}
        </li>
    );
};

export default TopNavbarListItem;
