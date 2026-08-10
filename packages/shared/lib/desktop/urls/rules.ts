import { APPS, APPS_CONFIGURATION } from '../../constants';
import type { SerializedUrlRule } from './builder';
import { urlRule } from './builder';

const CALENDAR_SUBDOMAIN = APPS_CONFIGURATION[APPS.PROTONCALENDAR].subdomain;

// Matches `/bookings`, `/bookings/`, `/bookings/*` and `/u/{localID}/bookings`.
const BOOKINGS_PATH_PATTERN = '(?:\\/bookings(?:\\/.*)?|\\/u\\/\\d+\\/bookings\\/?)';

export const CALENDAR_URL_RULES: SerializedUrlRule[] = [
    // Booking URLs open in the browser to avoid blocking the user in an in-app window.
    urlRule('calendar-bookings').forSubdomain(CALENDAR_SUBDOMAIN).pathRegex(BOOKINGS_PATH_PATTERN).build(),
];

const ACCOUNT_SUBDOMAIN = APPS_CONFIGURATION[APPS.PROTONACCOUNT].subdomain;

export const ACCOUNT_URL_RULES: SerializedUrlRule[] = [
    // Born-private onboarding opens in the browser.
    urlRule('account-born-private').forSubdomain(ACCOUNT_SUBDOMAIN).pathPrefix('/born-private').build(),

    // The lite account app opens in the browser.
    urlRule('account-lite').forSubdomain(ACCOUNT_SUBDOMAIN).pathIncludes('/lite').build(),

    // Upsell/signup flows carrying billing params open in the browser.
    urlRule('account-upsell')
        .forSubdomain(ACCOUNT_SUBDOMAIN)
        .pathIncludes('/signup')
        .withAnySearchParam(['plan', 'billing', 'currency', 'coupon'])
        .build(),

    // Close-ticket relies on window.close(), which only works in a real browser tab.
    urlRule('account-close-ticket').forSubdomain(ACCOUNT_SUBDOMAIN).pathExact('/close-ticket').build(),

    // Join-org invite opens in the browser.
    urlRule('account-join-org-invite')
        .forSubdomain(ACCOUNT_SUBDOMAIN)
        .pathIncludes('/join-org')
        .withAnyHashParam(['t'])
        .build(),
    // Update email preferences or unsubscribe should open in a browser tab.
    urlRule('account-update-daily-email-preferences')
        .forSubdomain(ACCOUNT_SUBDOMAIN)
        .pathIncludes('/unsubscribe')
        .build(),
];

/**
 * `.build()` can throw, the rules are validated in `urls.spec.ts` under shared,
 *  so there should be no error thrown at runtime.
 */
export const URL_RULES = [...CALENDAR_URL_RULES, ...ACCOUNT_URL_RULES];
