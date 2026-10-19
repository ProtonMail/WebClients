import { getValidatedProtonProtocolRedirect } from '@proton/shared/lib/authentication/fork/getValidatedProtonProtocol';

/**
 * What the native app is told when control is handed back to it. Always sent as the single `status` param:
 * - `success`: the address was connected (comes with `email`)
 * - `upsell`: the user reached the free limit and tapped "Upgrade to connect"
 */
type NativeReturnStatus = 'success' | 'upsell';

/**
 * Builds the URL that hands control back to the native app, e.g. `protonmail://connect-gmail/complete?status=success&email=…`.
 * Returns undefined when `redirect` is not a Proton app URL. Any query or hash already on `redirect` is dropped,
 * because `getValidatedProtonProtocolRedirect` only vets the scheme.
 */
const getNativeReturnUrl = (
    redirect: string | undefined,
    status: NativeReturnStatus,
    params: Record<string, string> = {}
): string | undefined => {
    const validated = getValidatedProtonProtocolRedirect(redirect);
    if (!validated) {
        return;
    }

    const [base] = validated.split(/[?#]/);
    return `${base}?${new URLSearchParams({ status, ...params }).toString()}`;
};

export const getNativeSuccessUrl = (redirect: string | undefined, email: string) => {
    return getNativeReturnUrl(redirect, 'success', { email });
};

export const getNativeUpsellUrl = (redirect: string | undefined) => {
    return getNativeReturnUrl(redirect, 'upsell');
};
