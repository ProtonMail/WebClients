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
                el[attribute] = baseUrl + el.getAttribute(attribute);
            });
        });

        return html;
    };
});
