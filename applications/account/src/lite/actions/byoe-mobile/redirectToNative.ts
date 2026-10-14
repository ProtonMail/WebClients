import { getValidatedProtonProtocolRedirect } from '@proton/shared/lib/authentication/fork/getValidatedProtonProtocol';

/**
 * Builds the URL that hands control back to the native app, e.g. `protonmail://connect-gmail/complete?status=success&email=…`.
 * Returns undefined when `redirect` is not a Proton app URL. Any query or hash already on `redirect` is dropped,
 * because `getValidatedProtonProtocolRedirect` only vets the scheme.
 */
export const getNativeSuccessUrl = (redirect: string | undefined, email: string): string | undefined => {
    const validated = getValidatedProtonProtocolRedirect(redirect);
    if (!validated) {
        return;
    }

    const [base] = validated.split(/[?#]/);
    return `${base}?${new URLSearchParams({ status: 'success', email }).toString()}`;
};
