import { ElementType } from 'react';
import { Box, PolymorphicComponentProps } from 'react-polymorphic-box';

import clsx from '@proton/utils/clsx';

import './Avatar.scss';

export type AvatarProps<E extends ElementType> = PolymorphicComponentProps<E, {}>;

const element = 'span';

const Avatar = <E extends ElementType = typeof element>({
    className: classNameProp,
    ...rest
}: PolymorphicComponentProps<E, {}>) => {
    const className = clsx(classNameProp, 'avatar rounded inline-flex flex-justify-center flex-align-items-center');

    return <Box as={element} className={className} {...rest} />;
};

export default Avatar;
