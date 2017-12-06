/* @ngInject */
function resurrecter(eventManager, AppModel, authentication) {
    function isAlive() {
        if (authentication.isLoggedIn() && !AppModel.is('onLine')) {
            eventManager.call();
        }
    }

    window.addEventListener('online', isAlive);

    return { init: angular.noop };
}
export default resurrecter;
