/**
 * The `remember` search parameter other apps pass to the login page. "Keep me signed in" is always on by default;
 * the mode only decides whether the checkbox to turn it off shows.
 */
export enum RememberMode {
    Visible = 0, // default
    /**
     * Enabled was added before we changed the default to always true.
     * This is no longer a distinct category and behaves the same as `Visible`
     * Kept for the callers that pass it.
     */
    Enabled = 1,
    Hidden = 2,
    /** Kept for the callers that pass it; the same as `Hidden`. */
    HiddenEnabled = 3,
}

export const showsRememberCheckbox = (mode: RememberMode) =>
    mode === RememberMode.Visible || mode === RememberMode.Enabled;

/**
 * Parses the `remember` search parameter. It's supported on the login routes as well as on `/authorize`,
 * in which case it's read from the search parameters of the initial location.
 */
export const getRememberModeSearchParameter = (...searchParams: (URLSearchParams | undefined)[]) => {
    for (const params of searchParams) {
        const value = params?.get('remember');
        if (!value) {
            continue;
        }
        const numericValue = parseInt(value, 10);
        if (!isNaN(numericValue) && numericValue in RememberMode) {
            return numericValue as RememberMode;
        }
    }
};
