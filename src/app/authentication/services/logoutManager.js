/* @ngInject */
function logoutManager(authentication, dispatchers, eventManager) {
    const { dispatcher, on } = dispatchers(['logout']);

    on('$stateChangeSuccess', (e, state) => {
        const currentState = state.name;
        const specialStates = ['login.setup'];

        if (currentState.indexOf('secured') === -1 && specialStates.indexOf(currentState) === -1) {
            // Stop event manager request
            eventManager.stop();
            // We automatically logout the user when he comes to login page and is already logged in
            authentication.isLoggedIn() && authentication.logout();
            // Dispatch an event to notify everybody that the user is no longer logged in
            dispatcher.logout();
        }
    });
    return {};
}
export default logoutManager;
