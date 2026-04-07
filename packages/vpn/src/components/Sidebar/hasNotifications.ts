import { ThemeColor } from '@proton/colors/types';
import type { NavItemResolved } from '@proton/nav/types/nav';

function isThemeColor(value: unknown): value is ThemeColor {
    return Object.values(ThemeColor).includes(value as ThemeColor);
}

export function hasNotifications(
    meta: NavItemResolved['meta']
): meta is NavItemResolved['meta'] & { hasNotifications: ThemeColor } {
    return 'hasNotifications' in meta && isThemeColor(meta.hasNotifications);
}
