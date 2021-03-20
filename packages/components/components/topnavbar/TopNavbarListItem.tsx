import React from 'react';
import { classnames } from '../../helpers';

interface Props extends React.ComponentPropsWithoutRef<'li'> {
    noShrink?: boolean;
}

const TopNavbarListItem = ({ children, noShrink, className, ...rest }: Props) => {
    if (!React.isValidElement(children)) {
        return null;
    }
    return (
        <li className={classnames([noShrink && 'flex-item-noshrink', className])} {...rest}>
            {children}
        </li>
    );
};

export default TopNavbarListItem;
