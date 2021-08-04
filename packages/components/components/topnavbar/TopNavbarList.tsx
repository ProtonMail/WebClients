import * as React from 'react';
import { classnames } from '../../helpers';

interface Props extends React.ComponentPropsWithoutRef<'ul'> {}

const TopNavbarList = ({ children }: Props) => {
    const validElements = React.Children.toArray(children).filter((child) => React.isValidElement(child));
    const navIconsLength = validElements.length;
    return (
        <ul
            className={classnames([
                'topnav-list unstyled mt0 mb0 ml1 flex flex-nowrap flex-align-items-center',
                navIconsLength >= 4 && 'topnav-list--four-elements',
            ])}
        >
            {children}
        </ul>
    );
};

export default TopNavbarList;
