import type { ElementType } from 'react';

import { Href } from '@proton/atoms/Href/Href';
import type { PolymorphicPropsWithoutRef } from '@proton/react-polymorphic-types';
import clsx from '@proton/utils/clsx';

interface DropdownMenuLinkOwnProps {}

export type DropdownMenuLinkProps<E extends ElementType> = PolymorphicPropsWithoutRef<DropdownMenuLinkOwnProps, E>;

const defaultElement = Href;

const DropdownMenuLink = <E extends ElementType = typeof defaultElement>({
    className = '',
    children,
    as,
    ...rest
}: DropdownMenuLinkProps<E>) => {
    const Element: ElementType = as || defaultElement;
    return (
        <Element
            {...rest}
            className={clsx(['dropdown-item-link w-full px-4 py-2 block text-no-decoration', className])}
        >
            {children}
        </Element>
    );
};

export default DropdownMenuLink;
