import type { ElementType, Ref } from 'react';
import { forwardRef, useMemo } from 'react';

import type { PolymorphicPropsWithoutRef } from 'packages/react-polymorphic-types';

import clsx from '@proton/utils/clsx';

import { type HueValue, getHue } from './getHue';
import { getRandomParticle } from './getRandomParticle';

interface UserAvatarOwnProps {
    name?: string;
    className?: string;
    color?: { hue: HueValue } | { hsl: string };
    size?: 'small' | 'medium';
    capitalize?: boolean;
}
export type UserAvatarProps<E extends ElementType> = PolymorphicPropsWithoutRef<UserAvatarOwnProps, E>;

const defaultElement = 'span';

const sizes = {
    small: '1.75rem',
    medium: '2rem',
};

export const UserAvatar = forwardRef(
    <E extends ElementType = typeof defaultElement>(
        { name, className, color, as, size = 'medium', style, capitalize = !!name, ...rest }: UserAvatarProps<E>,
        ref: Ref<Element>
    ) => {
        const nameWithColor = useMemo(
            () =>
                name
                    ? {
                          name,
                          color,
                      }
                    : getRandomParticle(),
            [name]
        );

        const hue = useMemo(
            () => getHue(nameWithColor.name, color || nameWithColor.color),
            [color, nameWithColor.name, nameWithColor.color]
        );

        const Element: ElementType = as || defaultElement;

        const width = sizes[size];
        const height = sizes[size];

        const letter = nameWithColor.name.substring(0, 1);

        return (
            <Element
                type="button"
                data-testid="user-avatar"
                className={clsx(
                    'h-custom w-custom',
                    'relative flex items-center justify-center overflow-hidden rounded user-select-none shrink-0',
                    'text-sm text-semibold',
                    capitalize && 'text-capitalize',
                    className
                )}
                style={
                    {
                        backgroundColor: `hsl(${hue}, 100%, 90%)`,
                        color: `hsl(${hue}, 100%, 10%)`,
                        '--h-custom': height,
                        '--w-custom': width,
                        ...style,
                    } as React.CSSProperties
                }
                ref={ref}
                {...rest}
            >
                {letter}
            </Element>
        );
    }
);

UserAvatar.displayName = 'UserAvatar';
