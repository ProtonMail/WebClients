/* @ngInject */
function transformStylesheet() {
    return (html) => {
        const firstElement = html.firstElementChild;

        /**
         * Some emails from ex: tripit contains a position absolute on the container
         * => hack to prevent margin on android/ios
         * @{@link https://twitter.com/HTeuMeuLeu/status/852110032045035520}
         * Gmail changes the dom too.
         */
        if (firstElement && /absolute/.test(firstElement.style.position)) {
            firstElement.style.position = 'inherit';
        }
        return html;
    };
}
export default transformStylesheet;
