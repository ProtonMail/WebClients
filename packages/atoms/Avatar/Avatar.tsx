import type { ElementType } from 'react';

import type { PolymorphicPropsWithoutRef } from '@proton/react-polymorphic-types';
import clsx from '@proton/utils/clsx';

import './Avatar.scss';

export type AvatarProps<E extends ElementType> = PolymorphicPropsWithoutRef<{ color?: 'weak' | 'norm' }, E>;

const defaultElement = 'span';

const Avatar = <E extends ElementType = typeof defaultElement>({
    className: classNameProp,
    color,
    as,
    ...rest
}: PolymorphicPropsWithoutRef<{}, E>) => {
    const className = clsx(
        classNameProp,
        'avatar rounded inline-flex justify-center items-center',
        color === 'weak' && 'avatar--weak'
    );
    const Element: ElementType = as || defaultElement;
    return <Element className={className} {...rest} aria-hidden="true" />;
};

export default Avatar;
