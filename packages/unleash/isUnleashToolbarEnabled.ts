const isWebDriverControlled = () => navigator.webdriver === true;

/** Development builds only: the toolbar's pre-filled context inputs make `domIsBusy()` permanently
 * true, which silently suppresses startup modals, spotlights and nudges on any environment QA tests. */
export const isUnleashToolbarEnabled = () =>
    process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && !isWebDriverControlled();
