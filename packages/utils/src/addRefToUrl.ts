/**
 * Appends an upsell `ref` parameter to a URL string.
 *
 * @param url - The URL or pathname to append the ref to. Can be relative (e.g. `/upgrade`)
 * or contain existing search params (e.g. `/dashboard?plan=mail2022`).
 * @param ref - The upsell ref value (e.g. `upsell_mail-banner-storage`). If empty or
 * undefined, the URL is returned unchanged.
 * @returns The URL with `ref=<ref>` appended, separated by `?` or `&` as appropriate.
 *
 * @example
 * addRefToUrl('/upgrade', 'upsell_mail-banner-storage')
 * // => '/upgrade?ref=upsell_mail-banner-storage'
 *
 * addRefToUrl('/dashboard?plan=mail2022', 'upsell_mail-banner-storage')
 * // => '/dashboard?plan=mail2022&ref=upsell_mail-banner-storage'
 *
 * addRefToUrl('/upgrade')
 * // => '/upgrade'
 */
export const addRefToUrl = (url: string, ref?: string): string => {
    if (!ref) {
        return url;
    }

    return `${url}${url.includes('?') ? '&' : '?'}ref=${ref}`;
};
