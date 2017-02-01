angular.module('proton.core')
.factory('labelModal', (pmModal, tools, hotkeys) => {
    return pmModal({
        controller(params, $timeout) {
            this.title = params.title;
            this.colors = tools.colors();

            hotkeys.unbind();

            if (angular.isDefined(params.label)) {
                this.name = params.label.Name;
                this.color = params.label.Color;
            } else {
                this.name = '';
                this.color = this.colors[0];
            }

            this.create = () => {
                if (angular.isDefined(params.create) && angular.isFunction(params.create)) {
                    params.create(this.name, this.color);
                    hotkeys.bind();

                }
            };

            this.cancel = () => {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                    hotkeys.bind();
                }
            };

            $timeout(() => {
                angular.element('#labelName').focus();
            }, 100, false);
        },
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/label.tpl.html'
    });
});
