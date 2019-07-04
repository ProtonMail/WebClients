/* @ngInject */
function lazyInject($http, $templateCache) {
    return {
        restrict: 'A',
        link(scope, el, { lazyInject }) {
            const attach = (html) => (el[0].innerHTML = html);
            $http
                .get(lazyInject, { cache: $templateCache })
                .then(({ data }) => data)
                .then(attach);
        }
    };
}

export default lazyInject;
