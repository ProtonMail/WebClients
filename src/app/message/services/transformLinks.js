angular.module('proton.message')
.factory('transformLinks', () => {
    return (html) => {
        const links = [].slice.call(html.querySelectorAll('a[href^=http]'));

        if (links.length > 0) {
            links.forEach((link) => {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noreferrer');
            });
        }

        return html;
    };
});
