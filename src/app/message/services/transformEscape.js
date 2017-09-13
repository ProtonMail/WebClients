angular.module('proton.message')
    .factory('transformEscape', () => {


        /**
         * Prevent escape url on the textContent if you display some code
         * inside the message
         * @param  {Node} node
         * @return {void}
         */
        const recursiveCleanerCode = (node) => {
            _.each(node.querySelectorAll('*'), (node) => {

                if (node.childElementCount) {
                    return recursiveCleanerCode(node);
                }

                if (/proton-/g.test(node.textContent)) {
                    node.textContent = node.textContent.replace(/proton-/g, '');
                }
            });
        };

        /**
         * Unescape the textContent only and inside a synthax Highlighting block
         * Compat
         *     - fontawesome
         *     - prism
         *     - etc.
         * @param  {Node} dom
         * @return {Node}
         */
        const syntaxHighlighterFilter = (dom) => {
            const $pre = dom.querySelectorAll('.pre, pre, code');
            _.each($pre, (node) => {

                if ((node.nodeName === 'PRE' || node.nodeName === 'CODE') && !node.childElementCount) {
                    node.textContent = node.textContent.replace(/proton-/g, '');
                    return;
                }
                recursiveCleanerCode(node);
            });

            return dom;
        };


        const REGEXP_IS_BREAK = new RegExp('(svg|xlink:href|srcset=|src=|background=|poster=)(?=(([^"><\\\\]|\\\\[^><])|"([^"><\\\\]|\\\\[^><])*")*>)', 'g');
        const REGEXP_IS_URL = new RegExp(/(url\()/ig);
        const replace = (regex, input) => input.replace(regex, 'proton-$1');

        return (html, message, { content = '' }) => {

            html.innerHTML = replace(REGEXP_IS_URL, replace(REGEXP_IS_BREAK, content));
            return syntaxHighlighterFilter(html);
        };
    });
