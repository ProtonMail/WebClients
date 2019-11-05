import { matches } from '../helpers/domHelper';

const PROTOCOLS = ['ftp://', 'http://', 'https://', 'xmpp:', 'tel:', 'callto:'];
const ALL_PROTOCOLS = PROTOCOLS.concat(['mailto:']);
const MAP = PROTOCOLS.reduce((acc, key) => ((acc[key] = true), acc), {});
const EXCLUDE_ANCHORS = ':not([href=""]):not([href^="#"])';

const getNormalizedHref = (link) => {
    return link
        .getAttribute('href')
        .trim()
        .toLowerCase();
};

const linkUsesProtocols = (link) => ALL_PROTOCOLS.some((proto) => getNormalizedHref(link).startsWith(proto));

const isEmptyAnchor = (link) => {
    const href = getNormalizedHref(link);
    return href === '' || MAP[href];
};

const noReferrerInfo = (link) => {
    link.setAttribute('rel', 'noreferrer nofollow noopener');
};

/**
 * make links open in a new tab
 * @param  {Array} links Collection of links
 * @return {Array}       links
 */
const httpInNewTab = (link) => {
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
 * @param  {Array} links Collection of links
 * @return {Array}       links
 */
const sanitizeRelativeHttpLinks = (link) => {
    if (matches(link, EXCLUDE_ANCHORS) && !linkUsesProtocols(link) && link.nodeName === 'A') {
        // link.href is the absolute value of the link: mail.protonmail.com is prepended, use getAttribute
        const url = link.getAttribute('href');

        link.setAttribute('href', `http://${url}`);
    }
};

/*
 * Anchors will work on the whole protonmail page, so we need to disable them
 * opening them in a new tab will just open a empty page.
 */
const disableAnchors = (link) => {
    isEmptyAnchor(link) && (link.style.pointerEvents = 'none');
};

export async function transformLinks(html) {
    const links = [...html.querySelectorAll('[href]')];

    links.forEach((link) => {
        httpInNewTab(link);
        noReferrerInfo(link);
        sanitizeRelativeHttpLinks(link);
        disableAnchors(link);
    });

    return html;
}
