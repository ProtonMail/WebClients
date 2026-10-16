const INTERNAL_HOST_PATTERNS = [/^lumo\.proton\.dev$/i, /^lumo\.([a-z0-9-]+\.)*proton\.black$/i];

/**
 * True on internal Lumo environments: `lumo.proton.dev`, `lumo.proton.black` and `lumo.*.proton.black`.
 * Gates debug tooling that simulates errors or mutates data.
 */
export const isInternalLumoHost = (hostname: string = window.location.hostname): boolean =>
    INTERNAL_HOST_PATTERNS.some((pattern) => pattern.test(hostname));
