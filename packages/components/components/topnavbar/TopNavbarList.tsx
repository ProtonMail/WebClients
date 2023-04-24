import { Children, ComponentPropsWithoutRef, isValidElement } from 'react';

import { classnames } from '../../helpers';

interface Props extends ComponentPropsWithoutRef<'ul'> {}

const TopNavbarList = ({ children }: Props) => {
    const validElements = Children.toArray(children).filter((child) => isValidElement(child));
    const navIconsLength = validElements.length;
    return (
        <ul
            className={classnames([
                'topnav-list unstyled my-0 ml1 flex flex-nowrap flex-align-items-center',
                navIconsLength >= 4 && 'topnav-list--four-elements',
            ])}
        >
            {children}
        </ul>
    );
};

export default TopNavbarList;
