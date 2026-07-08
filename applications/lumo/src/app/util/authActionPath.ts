/**
 * `remember=3` maps to the account login page's `RememberMode.HiddenEnabled`: the "Keep me signed
 * in" checkbox is hidden AND forced on. Inside the native mobile app a login is a login for an
 * installed app, so we want it always on and the toggle hidden — whereas a normal browser keeps
 * the default, user-controlled checkbox.
 */
const REMEMBER_HIDDEN_ENABLED = '3';

/**
 * Builds the account navigation path used by the guest "Sign in" / "Create account" links when we
 * fall back to a web navigation (i.e. the native auth bridge is not handling the action). Only the
 * sign-in path inside the native mobile app is decorated with `remember=3`; everything else is left
 * as-is.
 */
export const getAuthActionAccountPath = ({
    action,
    basePath,
    isMobileApp,
}: {
    action: 'signin' | 'signup';
    basePath: string;
    isMobileApp: boolean;
}): string => {
    if (action !== 'signin' || !isMobileApp) {
        return basePath;
    }

    const queryIndex = basePath.indexOf('?');
    const pathname = queryIndex === -1 ? basePath : basePath.slice(0, queryIndex);
    const params = new URLSearchParams(queryIndex === -1 ? '' : basePath.slice(queryIndex + 1));

    if (!params.has('remember')) {
        params.set('remember', REMEMBER_HIDDEN_ENABLED);
    }

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
};
