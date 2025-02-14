import type { ElementType } from 'react';

import type { PolymorphicPropsWithoutRef } from 'packages/react-polymorphic-types';
import tinycolor from 'tinycolor2';

import { getAccentColorForUsername } from './getAccentColorForUsername';

function parseHueFromHSLstring(hsl: string): number | undefined {
    const NumberRegex = /(\d+)/;
    const numberMatch = hsl.match(NumberRegex)?.[0];
    return numberMatch ? parseInt(numberMatch) : undefined;
}

/** A number between 0 to 360 */
export type HueValue = number;

export const UserAvatarHueCache = new Map<string, number>();

interface UserAvatarOwnProps {
    name?: string;
    className?: string;
    color?: { hue: HueValue } | { hsl: string };
    size?: 'small' | 'medium';
}

export type UserAvatarProps<E extends ElementType> = PolymorphicPropsWithoutRef<UserAvatarOwnProps, E>;

export const getHue = (name: string, color?: { hue: HueValue } | { hsl: string }) => {
    if (color) {
        if ('hsl' in color) {
            if (color.hsl) {
                const parsed = parseHueFromHSLstring(color.hsl);
                if (parsed && !isNaN(parsed)) {
                    return parsed;
                }
            }
        } else if (!isNaN(color.hue)) {
            return color.hue;
        }
    }

    const cachedHue = UserAvatarHueCache.get(name);
    if (cachedHue) {
        return cachedHue;
    }

    const hue = tinycolor(getAccentColorForUsername(name)).toHsl().h;
    UserAvatarHueCache.set(name, hue);
    return hue;
};
