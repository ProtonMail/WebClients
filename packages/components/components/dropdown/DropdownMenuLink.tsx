import { ElementType } from 'react';
import { PolymorphicPropsWithoutRef } from 'react-polymorphic-types';

import { Href } from '@proton/atoms';

import { classnames } from '../../helpers';

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
            className={classnames(['dropdown-item-link w100 pr1 pl1 pt0-5 pb0-5 block text-no-decoration', className])}
        >
            {children}
        </Element>
    );
};

export default DropdownMenuLink;
