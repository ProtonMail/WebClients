angular.module('proton.core')
    .factory('confirmModal', (pmModal) => {
        return pmModal({
            controllerAs: 'ctrl',
            templateUrl: 'templates/modals/confirm.tpl.html',
            /* @ngInject */
            controller: function (params, hotkeys) {

                hotkeys.unbind(['enter']);
                this.title = params.title;
                this.message = params.message;
                this.confirm = () => (hotkeys.bind(['enter']), params.confirm());
                this.cancel = () => (hotkeys.bind(['enter']), params.cancel());

                // The button is not directly available
                setTimeout(() => angular.element('#confirmModalBtn').focus(), 100);
            }
        });
    });
