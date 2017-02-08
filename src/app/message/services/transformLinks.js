angular.module('proton.message')
.factory('transformLinks', () => {
    return (html) => {
        const links = [].slice.call(html.querySelectorAll('a[href^="http"]'));
        const linksRelative = [].slice.call(html.querySelectorAll('a[href]:not([href^="http:"]):not([href^="https:"]):not([href^="mailto"])'));

        _.each(links, (link) => {
            link.setAttribute('target', '_blank');
        });

        _.each(linksRelative, (link) => {
            const url = link.href.replace(`${location.origin}/`, '');
            link.href = `http://${url}`;
            link.setAttribute('target', '_blank');
        });

        return html;
    };
});
