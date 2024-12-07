import { getUTMTrackersFromURL } from '@proton/shared/lib/mail/trackers';
import type { MessageUTMTracker } from '@proton/shared/lib/models/mailUtmTrackers';

import { matches } from '../dom';

const PROTOCOLS = ['ftp://', 'http://', 'https://', 'xmpp:', 'tel:', 'callto:'];
const ALL_PROTOCOLS = PROTOCOLS.concat(['mailto:']);
const MAP = PROTOCOLS.reduce<{ [key: string]: boolean }>((acc, key) => {
    acc[key] = true;
    return acc;
}, {});
const EXCLUDE_ANCHORS = ':not([href=""]):not([href^="#"])';

const getNormalizedHref = (link: HTMLLinkElement) => {
    return (link.getAttribute('href') || '').trim().toLowerCase();
};

const linkUsesProtocols = (link: HTMLLinkElement) =>
    ALL_PROTOCOLS.some((proto) => getNormalizedHref(link).startsWith(proto));

const isEmptyAnchor = (link: HTMLLinkElement) => {
    const href = getNormalizedHref(link);
    return href === '' || MAP[href];
};

const noReferrerInfo = (link: HTMLLinkElement) => {
    link.setAttribute('rel', 'noreferrer nofollow noopener');
};

/**
 * make links open in a new tab
 */
const httpInNewTab = (link: HTMLLinkElement) => {
    if (matches(link, EXCLUDE_ANCHORS)) {
        const href = link.getAttribute('href') || '';
        const hasHTTP = href.indexOf('http') === 0;
        const isRelative = href.indexOf('/') === 0;
        // Prevent issue for Edge/IE A security problem cf https://jsfiddle.net/dpaoxoks/7/
        if (hasHTTP || isRelative) {
            link.setAttribute('target', '_blank');
        }
    }
};

/**
 * turn these relative links into absolute links
 * (example.com/a -> http://example.com)
 */
const sanitizeRelativeHttpLinks = (link: HTMLLinkElement) => {
    if (matches(link, EXCLUDE_ANCHORS) && !linkUsesProtocols(link) && link.nodeName === 'A') {
        // link.href is the absolute value of the link: mail.proton.me is prepended, use getAttribute
        const url = link.getAttribute('href');

        if (url && !url.toLowerCase().startsWith('hxxps')) {
            link.setAttribute('href', `http://${url}`);
        }
    }
};

const removeTrackingTokens = (link: HTMLLinkElement) => {
    if (matches(link, EXCLUDE_ANCHORS) && link.nodeName === 'A') {
        const href = link.getAttribute('href');

        if (href) {
            const result = getUTMTrackersFromURL(href);

            if (result) {
                link.setAttribute('href', result.url);
                return result?.utmTracker;
            }
        }
    }
};

/*
 * Anchors will work on the whole protonmail page, so we need to disable them
 * opening them in a new tab will just open a empty page.
 */
const disableAnchors = (link: HTMLLinkElement) => {
    if (isEmptyAnchor(link)) {
        link.style.pointerEvents = 'none';
    }
};

export const transformLinks = (
    document: Element,
    onCleanUTMTrackers: (utmTrackers: MessageUTMTracker[]) => void,
    canCleanUTMTrackers: boolean
) => {
    const links = [...document.querySelectorAll('[href]')] as HTMLLinkElement[];

    const utmTrackers: MessageUTMTracker[] = [];

    links.forEach((link) => {
        httpInNewTab(link);
        noReferrerInfo(link);

        if (canCleanUTMTrackers) {
            const tracker = removeTrackingTokens(link);

            if (tracker) {
                utmTrackers.push(tracker);
            }
        }

        sanitizeRelativeHttpLinks(link);
        disableAnchors(link);
    });

    if (utmTrackers.length > 0) {
        onCleanUTMTrackers(utmTrackers);
    }
};
