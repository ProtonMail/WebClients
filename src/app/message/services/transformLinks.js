angular.module('proton.message')
    .factory('transformLinks', () => {

        const PROTOCOLS = ['ftp://', 'http://', 'https://', 'xmpp:', 'tel:', 'callto:', 'mailto:'];

        const PROTO_ALLOWS_NO_URI = ['mailto:'];

        const EXCLUDE_ANCHORS = ':not([href=""]):not([href^="#"])';

        const getNormalizedHref = (link) => link.getAttribute('href').trim().toLowerCase();
        const linkUsesProtocols = (protos, link) => protos.some((proto) => getNormalizedHref(link).startsWith(proto));

        const isAnchor = (link) => {
            const href = getNormalizedHref(link);

            return href === '' || href[0] === '#'
                || _.difference(PROTOCOLS, PROTO_ALLOWS_NO_URI).some((proto) => href === proto);
        };

        return (html) => {


            const noReferrerInfo = (html) => {
                const links = [].slice.call(html.querySelectorAll('[href]'));
                _.each(links, (link) => {
                    /**
                     * Prevent attack via the referrer
                     *  > area with a target blank and a redirect on window.opener
                     * {@link https://www.jitbit.com/alexblog/256-targetblank---the-most-underestimated-vulnerability-ever/}
                     * {@link https://mathiasbynens.github.io/rel-noopener/}
                     */
                    link.setAttribute('rel', 'noreferrer nofollow noopener');
                });
            };

            // make links open in a new tab
            const httpInNewTab = (html) => {

                // don't select in querySelector: we need to check the browser `href` instead of the attribute
                // (i.e. where the browser will actually link to)
                const links = [].slice.call(html.querySelectorAll('[href]' + EXCLUDE_ANCHORS));
                _.each(links, (link) => {
                    if ((link.href || '').indexOf('http') === 0) {
                        link.setAttribute('target', '_blank');
                    }
                });
            };


            // turn these relative links into absolute links (example.com/a -> http://example.com)
            const sanitizeRelativeHttpLinks = (html) => {

                const links = [].slice.call(html.querySelectorAll('a[href]' + EXCLUDE_ANCHORS));

                // we need to do the filtering without the querySelector as the querySelector is case sensitive.
                const relativeLinks = _.filter(links, (link) => !linkUsesProtocols(PROTOCOLS, link));

                _.each(relativeLinks, (link) => {
                    // link.href is the absolute value of the link: mail.protonmail.com is prepended, use getAttribute
                    const url = link.getAttribute('href');

                    link.href = `http://${url}`;
                    link.setAttribute('target', '_blank');
                });
            };

            // anchors will work on the whole protonmail page, so we need to disable them
            // opening them in a new tab will just open a empty page.
            const disableAnchors = (html) => {

                const links = [].slice.call(html.querySelectorAll('[href]'));

                // we can't do the filtering in querySelectorAll this needs to be case insensitive.
                const anchors = _.filter(links, (link) => isAnchor(link));

                _.each(anchors, (link) => {
                    link.style.pointerEvents = 'none';
                });
            };

            noReferrerInfo(html);
            httpInNewTab(html);

            // handle hrefs without protocols: either an anchor or a relative link
            sanitizeRelativeHttpLinks(html);
            disableAnchors(html);

            return html;
        };
    });
