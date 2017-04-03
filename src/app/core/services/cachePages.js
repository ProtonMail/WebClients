angular.module('proton.core')
.factory('cachePages', ($rootScope) => {
    const pages = [];
    const inside = (page) => pages.indexOf(page) > -1;
    const add = (page) => pages.push(page);
    const clear = () => pages.length = 0;

    $rootScope.$on('$stateChangeStart', (event, toState, toParams, fromState) => {
        if (fromState !== toState) {
            clear();
        }
    });

    return { init: angular.noop, add, inside, clear };
});
