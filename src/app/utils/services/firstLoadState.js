/* @ngInject */
function firstLoadState($rootScope, tools) {
    let first = true;

    const get = () => first;
    const set = (state) => (first = state);
    const cleanState = tools.filteredState;

    $rootScope.$on('$stateChangeStart', (e, toState, toParams, fromState) => {
        first = cleanState(fromState.name) !== cleanState(toState.name);
    });

    return { get, set };
}
export default firstLoadState;
