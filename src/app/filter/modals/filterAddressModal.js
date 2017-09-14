angular.module('proton.filter')
    .factory('filterAddressModal', (pmModal, spamListModel) => {

        return pmModal({
            controllerAs: 'ctrl',
            templateUrl: 'templates/filter/filterAddressModal.tpl.html',
            /* @ngInject */
            controller: function (params) {

                this.filter = { Email: '' };
                this.cancel = params.close;
                this.type = params.type;
                this.create = () => {
                    spamListModel.add(this.filter.Email, spamListModel.getType(params.type));
                    params.close();
                };

                setTimeout(() => {
                    angular.element('#emailAddress').focus();
                }, 100);
            }
        });
    });
