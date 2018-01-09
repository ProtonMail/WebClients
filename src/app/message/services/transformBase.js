/**
 * Append base url to any href/src if we need to
 * @param  {Node} html Mail parser
 * @param  {Document} doc  Output from DOMPurify
 * @return {Node}      Parser
 */
function transformBase(html, doc) {
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

    const base = doc.querySelector('base') || {};
    if (!base.href) {
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
            const url = value.charAt(0) === '/' ? value.slice(1) : value;
            el[attribute] = baseUrl + url;
        });
    });

    return html;
}
export default transformBase;
