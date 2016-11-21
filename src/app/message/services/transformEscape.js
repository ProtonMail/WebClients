angular.module('proton.message')
.factory('transformEscape', () => {

    const REGEXP_IS_BREAK = new RegExp('(<svg|xlink:href|srcset|src=|background=|poster=)', 'g');
    // const REGEXP_IS_BREAK = new RegExp('(<svg|xlink:href|srcset|(^(?!proton-)src=)|background=|poster=)', 'g')
    const REGEXP_IS_URL = new RegExp(/url\(/ig);
    const REGEXP_IS_PROTON = new RegExp(/proton-/ig);
    const replace = (regex, input) => input.replace(regex, (match) => `proton-${match}`);

    return (html, message, { content = '' }) => {
        const input = content.replace(REGEXP_IS_PROTON, '');
        html.innerHTML = replace(REGEXP_IS_URL, replace(REGEXP_IS_BREAK, input));
        return html;
    };
});
// (<svg|xlink:href|srcset|(proton-)?src|background=|poster=)
