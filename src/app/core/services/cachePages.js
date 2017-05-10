angular.module('proton.core')
.factory('cachePages', ($rootScope, tools) => {
    const pages = [];
    const inside = (page) => pages.indexOf(page) > -1;
    const add = (page) => pages.push(page);
    const clear = () => pages.length = 0;
    const consecutive = (page) => {
        for (let i = page; i >= 0; i--) {
            if (pages.indexOf(i) === -1) {
                return false;
            }
        }
        return true;
    };

    $rootScope.$on('$stateChangeStart', (event, toState, toParams, fromState) => {
        if (tools.filteredState(fromState.name) !== tools.filteredState(toState.name)) {
            clear();
        }
    });

    return { init: angular.noop, add, inside, clear, consecutive };
});
