angular.module('proton.message')
    .factory('transformLinks', () => {

        return (html) => {

            const links = [].slice.call(html.querySelectorAll('[href]'));
            const linksRelative = [].slice.call(html.querySelectorAll('a[href]:not([href^="http:"]):not([href^="https:"]):not([href^="mailto"])'));

            _.each(links, (link) => {
                /**
                 * Prevent attack via the referrer
                 *  > area with a target blank and a redirect on window.opener
                 * {@link https://www.jitbit.com/alexblog/256-targetblank---the-most-underestimated-vulnerability-ever/}
                 * {@link https://mathiasbynens.github.io/rel-noopener/}
                 */
                link.setAttribute('rel', 'noreferrer nofollow noopener');

                const href = (link.href || '');

                // I can have a src inside the url etc.
                link.href = href.replace(/proton-/g, '');

                if (href.indexOf('http') === 0) {
                    link.setAttribute('target', '_blank');
                }
            });

            _.each(linksRelative, (link) => {
                const url = link.href.replace(`${location.origin}/`, '');
                link.href = `http://${url}`;
                link.setAttribute('target', '_blank');
            });

            return html;
        };
    });
