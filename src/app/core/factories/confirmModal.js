angular.module('proton.core')
.factory('confirmModal', (pmModal) => {
    return pmModal({
        controller(params) {
            this.message = params.message;
            this.title = params.title;

            Mousetrap.bind('enter', () => {
                this.confirm();

                return false;
            });

            this.confirm = () => {
                Mousetrap.unbind('enter');
                params.confirm();
            };

            this.cancel = () => {
                Mousetrap.unbind('enter');
                params.cancel();
            };
        },
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/confirm.tpl.html'
    });
});
