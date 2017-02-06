angular.module('proton.elements')
.factory('firstLoad', ($rootScope, tools) => {
    let first = true;
    $rootScope.$on('$stateChangeStart', (event, toState, toParams, fromState) => {
        first = cleanState(fromState.name) !== cleanState(toState.name);
    });
    function cleanState(state) {
        return tools.filteredState(state);
    }
    function get() {
        return first;
    }
    function set(state) {
        first = state;
    }
    return { get, set };
});
