import { PLANS } from '@proton/payments/core/constants';
import { getHas2025OfferCoupon } from '@proton/payments/core/subscription/helpers';
import { SSO_PATHS } from '@proton/shared/lib/constants';
import { ThemeModeSetting, ThemeTypes } from '@proton/shared/lib/themes/constants';
import type { ThemeSetting } from '@proton/shared/lib/themes/themes';

/**
 * Primary purpose of this functionality is to ensure that the initial loader page has the same theme
 * as the rest of the page to avoid a flash
 */
export const getThemeFromLocation = (
    location: Location,
    searchParams: URLSearchParams
): Partial<ThemeSetting> | null => {
    const hasBFCoupon = getHas2025OfferCoupon(searchParams.get('coupon')?.toUpperCase());
    const hasVisionary = searchParams.get('plan')?.toLowerCase() === PLANS.VISIONARY;
    const hasDarkTheme = searchParams.get('theme') === 'dark';

    if (
        (location.pathname.includes('signup') && (hasBFCoupon || hasVisionary || hasDarkTheme)) ||
        (location.pathname === SSO_PATHS.PASS_SIGNUP && searchParams.get('mode') === 'ctx') ||
        location.pathname === SSO_PATHS.PASS_SIGNUP_B2B ||
        location.pathname === SSO_PATHS.MAIL_SIGNUP_B2B ||
        location.pathname === SSO_PATHS.DRIVE_SIGNUP_B2B ||
        location.pathname === SSO_PATHS.LUMO_SIGNUP_B2B ||
        location.pathname === SSO_PATHS.BUSINESS_SIGNUP
    ) {
        return {
            DarkTheme: ThemeTypes.Carbon,
            Mode: ThemeModeSetting.Dark,
        };
    }

    if (location.pathname === SSO_PATHS.WALLET_SIGNUP) {
        return {
            LightTheme: ThemeTypes.StorefrontWallet,
            Mode: ThemeModeSetting.Light,
        };
    }

    if (
        location.pathname.includes('signup') ||
        SSO_PATHS.REFERAL_SIGNUP ||
        SSO_PATHS.REFERAL_PLAN_SELECTION ||
        SSO_PATHS.GREENLAND_SIGNUP ||
        SSO_PATHS.START ||
        SSO_PATHS.PASS_SIGNUP ||
        SSO_PATHS.MAIL_SIGNUP ||
        SSO_PATHS.CALENDAR_SIGNUP ||
        SSO_PATHS.DRIVE_SIGNUP ||
        SSO_PATHS.DOCS_SIGNUP ||
        SSO_PATHS.VPN_SIGNUP ||
        SSO_PATHS.LUMO_SIGNUP ||
        SSO_PATHS.MEET_SIGNUP
    ) {
        return {
            LightTheme: ThemeTypes.Storefront,
            Mode: ThemeModeSetting.Light,
        };
    }

    return null;
};
