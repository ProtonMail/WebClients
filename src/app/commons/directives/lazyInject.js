/* @ngInject */
function lazyInject($http, $templateCache) {
    return {
        restrict: 'A',
        link(scope, $element, $attr) {
            // Can't use compile because the attribute can be an expression.
            const src = $attr.lazyInject;
            const attach = (html) => {
                $element[0].innerHTML = html;
            };
            $http
                .get(src, { cache: $templateCache })
                .then(({ data }) => data)
                .then(attach);
        }
    };
}

export default lazyInject;
