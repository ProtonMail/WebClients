import { ElementType } from 'react';
import { PolymorphicPropsWithoutRef } from 'react-polymorphic-types';

import clsx from '@proton/utils/clsx';

import './Avatar.scss';

export type AvatarProps<E extends ElementType> = PolymorphicPropsWithoutRef<{}, E>;

const defaultElement = 'span';

const Avatar = <E extends ElementType = typeof defaultElement>({
    className: classNameProp,
    as,
    ...rest
}: PolymorphicPropsWithoutRef<{}, E>) => {
    const className = clsx(classNameProp, 'avatar rounded inline-flex flex-justify-center flex-align-items-center');
    const Element: ElementType = as || defaultElement;
    return <Element className={className} {...rest} aria-hidden="true" />;
};

export default Avatar;
