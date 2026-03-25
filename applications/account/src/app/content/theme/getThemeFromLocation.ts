import { PLANS } from '@proton/payments/core/constants';
import { getHas2025OfferCoupon } from '@proton/payments/core/subscription/helpers';
import { SSO_PATHS } from '@proton/shared/lib/constants';
import { ThemeModeSetting, ThemeTypes } from '@proton/shared/lib/themes/constants';
import type { ThemeSetting } from '@proton/shared/lib/themes/themes';

import { stripLocaleTagPrefix } from '../../locales';

/**
 * Primary purpose of this functionality is to ensure that the initial loader page has the same theme
 * as the rest of the page to avoid a flash
 */
export const getThemeFromLocation = (
    location: Location,
    searchParams: URLSearchParams
): Partial<ThemeSetting> | null => {
    const { pathname } = stripLocaleTagPrefix(location.pathname);

    const hasBFCoupon = getHas2025OfferCoupon(searchParams.get('coupon')?.toUpperCase());
    const hasVisionary = searchParams.get('plan')?.toLowerCase() === PLANS.VISIONARY;
    const hasDarkTheme = searchParams.get('theme') === 'dark';

    if (pathname === SSO_PATHS.PASS_SIGNUP && searchParams.get('mode') === 'ctx') {
        return {
            DarkTheme: ThemeTypes.Carbon,
            Mode: ThemeModeSetting.Dark,
        };
    }

    if (
        (pathname.includes('signup') && (hasBFCoupon || hasVisionary || hasDarkTheme)) ||
        pathname === SSO_PATHS.PASS_SIGNUP_B2B ||
        pathname === SSO_PATHS.MAIL_SIGNUP_B2B ||
        pathname === SSO_PATHS.DRIVE_SIGNUP_B2B ||
        pathname === SSO_PATHS.LUMO_SIGNUP_B2B ||
        pathname === SSO_PATHS.BUSINESS_SIGNUP
    ) {
        return {
            DarkTheme: ThemeTypes.Storefront,
            Mode: ThemeModeSetting.Dark,
        };
    }

    if (pathname === SSO_PATHS.WALLET_SIGNUP) {
        return {
            LightTheme: ThemeTypes.StorefrontWallet,
            Mode: ThemeModeSetting.Light,
        };
    }

    if (pathname === SSO_PATHS.MEET_SIGNUP) {
        return {
            DarkTheme: ThemeTypes.Carbon,
            Mode: ThemeModeSetting.Dark,
        };
    }

    if (
        pathname.includes('signup') ||
        pathname === SSO_PATHS.REFERAL_SIGNUP ||
        pathname === SSO_PATHS.REFERAL_PLAN_SELECTION ||
        pathname === SSO_PATHS.GREENLAND_SIGNUP ||
        pathname === SSO_PATHS.START ||
        pathname === SSO_PATHS.PASS_SIGNUP ||
        pathname === SSO_PATHS.MAIL_SIGNUP ||
        pathname === SSO_PATHS.CALENDAR_SIGNUP ||
        pathname === SSO_PATHS.DRIVE_SIGNUP ||
        pathname === SSO_PATHS.DOCS_SIGNUP ||
        pathname === SSO_PATHS.VPN_SIGNUP ||
        pathname === SSO_PATHS.LUMO_SIGNUP ||
        pathname === SSO_PATHS.BORN_PRIVATE ||
        pathname === SSO_PATHS.BORN_PRIVATE_ACTIVATE ||
        pathname === SSO_PATHS.BORN_PRIVATE_RECOVERY
    ) {
        return {
            LightTheme: ThemeTypes.Storefront,
            Mode: ThemeModeSetting.Light,
        };
    }

    if (pathname === SSO_PATHS.PASS_EXTENSION_ONBOARDING) {
        return {
            DarkTheme: ThemeTypes.PassDark,
            Mode: ThemeModeSetting.Dark,
        };
    }

    return null;
};
