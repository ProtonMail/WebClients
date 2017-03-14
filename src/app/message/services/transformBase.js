angular.module('proton.message')
.factory('transformBase', () => {
    const elements = [
        {
            selector: 'a:not([href^=http])',
            attribute: 'href'
        },
        {
            selector: 'img:not([src^=http])',
            attribute: 'src'
        }
    ];

    return (html) => {
        const base = html.querySelector('base');
        if (!base || !base.href) {
            return html;
        }

        // Make sure base has trailing slash
        let baseUrl = base.href;
        if (baseUrl.substr(-1, 1) !== '/') {
            baseUrl += '/';
        }

        elements.forEach(({ selector, attribute }) => {
            [].slice.call(html.querySelectorAll(selector)).forEach((el) => {
                const value = el.getAttribute(attribute) || '';
                // Ensure we don't add a useless / if we already have one
                const url = (value.charAt(0) === '/') ? value.slice(1) : value;
                el[attribute] = baseUrl + url;
            });
        });

        return html;
    };
});
