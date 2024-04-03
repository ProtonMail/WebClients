/**
 * Replaces the origin to match the current origin, if running using `local-sso`.
 */

export const replaceLocalURL = (href: string) => {
    // Ignore if not in local-sso
    if (!window.location.hostname.endsWith('proton.local')) {
        return href;
    }

    const url = new URL(href);
    const newSubdomain = url.hostname.split('.')[0];
    const subdomain = window.location.hostname.split('.')[0];

    // Replace host to preserve the port for local-sso
    return href.replace(url.host, window.location.host.replace(subdomain, newSubdomain));
};
