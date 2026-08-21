export enum RememberMode {
    Visible = 0, // default
    Enabled = 1,
    Hidden = 2,
    HiddenEnabled = 3,
}

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
