angular.module('proton.core')
.factory('hotkeyModal', (pmModal, authentication, CONSTANTS) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/hotkey.tpl.html',
        controller(params) {
            this.isMac = navigator.userAgent.indexOf('Mac OS X') !== -1;

            if (authentication.user.ViewLayout === CONSTANTS.ROW_MODE) {
                this.mode = 'row';
            } else if (authentication.user.ViewLayout === CONSTANTS.COLUMN_MODE) {
                this.mode = 'column';
            }

            this.close = function () {
                params.close();
            };
        }
    });
});
