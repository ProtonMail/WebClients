/**
 * Whether the `signup=0` search parameter hides the sign-up prompt, for apps that sign users in only (the native
 * apps' web sign-in). Like `remember`, it's read from the initial location too, to support it on `/authorize`.
 */
export const getHidesSignUpPrompt = (...searchParams: (URLSearchParams | undefined)[]) =>
    searchParams.some((params) => params?.get('signup') === '0');
