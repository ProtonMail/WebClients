import { isDevOrBlackHost } from '@proton/shared/lib/env';
import { getItem } from '@proton/shared/lib/helpers/storage';

/** Set to the string `'true'` to show the toolbar on a dev or black host outside a development build.
 * While it is shown, startup modals, spotlights and nudges stay hidden (see below). */
export const ENABLE_UNLEASH_TOOLBAR_KEY = 'enable-unleash-toolbar';

const isWebDriverControlled = () => navigator.webdriver === true;

const isOptedInOnDevOrBlackHost = () =>
    isDevOrBlackHost(window.location.host) && getItem(ENABLE_UNLEASH_TOOLBAR_KEY) === 'true';

/** Opt-in outside development builds: the toolbar's pre-filled context inputs make `domIsBusy()`
 * permanently true, which silently suppresses startup modals, spotlights and nudges. */
export const isUnleashToolbarEnabled = () =>
    typeof window !== 'undefined' &&
    !isWebDriverControlled() &&
    (process.env.NODE_ENV === 'development' || isOptedInOnDevOrBlackHost());
