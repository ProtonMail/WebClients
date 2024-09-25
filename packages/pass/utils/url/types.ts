import type { MaybeNull, RequiredNonNull, TabId } from '@proton/pass/types';

export type ParsedUrl = {
    /* domain without suffix */
    displayName: MaybeNull<string>;
    /* widest top-level domain */
    domain: MaybeNull<string>;
    /* subdomain if any */
    subdomain: MaybeNull<string>;
    /* hostname of the URL */
    hostname: MaybeNull<string>;
    /* protocol */
    protocol: MaybeNull<string>;
    /* port */
    port: MaybeNull<string>;
    /* URL matches top-level domain */
    isTopLevelDomain: boolean;
    /* private domain from public suffix list */
    isPrivate: boolean;
    /* matches `https:` protocol */
    isSecure: boolean;
};

export type URLComponents = Pick<ParsedUrl, 'domain' | 'port' | 'protocol'>;

export type SanitizedUrl = {
    valid: boolean;
    hostname: MaybeNull<string>;
    protocol: MaybeNull<string>;
    port: MaybeNull<string>;
    url: string;
};

export type ParsedSenderUrl = RequiredNonNull<ParsedUrl, 'domain' | 'protocol'>;
export type ParsedSender = { tabId: TabId; url: ParsedSenderUrl };
