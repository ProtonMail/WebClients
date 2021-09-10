import { ComponentPropsWithoutRef, isValidElement } from 'react';
import { classnames } from '../../helpers';

interface Props extends ComponentPropsWithoutRef<'li'> {
    noShrink?: boolean;
    collapsedOnDesktop?: boolean;
}

const TopNavbarListItem = ({ children, noShrink, collapsedOnDesktop = true, className, ...rest }: Props) => {
    if (!isValidElement(children)) {
        return null;
    }
    return (
        <li
            className={classnames([
                'topnav-listItem',
                noShrink && 'flex-item-noshrink',
                !collapsedOnDesktop && 'topnav-listItem--noCollapse',
                className,
            ])}
            {...rest}
        >
            {children}
        </li>
    );
};

export default TopNavbarListItem;
