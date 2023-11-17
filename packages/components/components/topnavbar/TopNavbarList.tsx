import { Children, ComponentPropsWithoutRef, isValidElement } from 'react';

import clsx from '@proton/utils/clsx';

interface Props extends ComponentPropsWithoutRef<'ul'> {}

const TopNavbarList = ({ children }: Props) => {
    const validElements = Children.toArray(children).filter((child) => isValidElement(child));
    const navIconsLength = validElements.length;
    return (
        <ul
            className={clsx([
                'topnav-list unstyled my-0 ml-2 gap-2 flex flex-nowrap items-center hidden-empty',
                navIconsLength >= 4 && 'topnav-list--four-elements',
            ])}
        >
            {children}
        </ul>
    );
};

export default TopNavbarList;
