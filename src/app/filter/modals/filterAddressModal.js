angular.module('proton.filter')
    .factory('filterAddressModal', (pmModal) => {

        return pmModal({
            controllerAs: 'ctrl',
            templateUrl: 'templates/filter/filterAddressModal.tpl.html',
            controller(params) {

                this.filter = { Email: '' };
                this.cancel = params.close;
                this.list = params.list;
                this.create = () => {
                    params.add(this.filter.Email);
                };

                setTimeout(() => {
                    angular.element('#emailAddress').focus();
                }, 100);
            }
        });
    });
