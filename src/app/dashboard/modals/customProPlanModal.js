angular.module('proton.dashboard')
    .factory('customProPlanModal', (customProPlanModel, gettextCatalog, pmModal) => {
        const I18N = {
            members(value) {
                return gettextCatalog.getPlural(value, '1 user', '{{$count}} users', 'Custom pro plan dashboard');
            },
            storage(value) {
                return gettextCatalog.getString('{{value}} GB storage', { value }, 'Custom pro plan dashboard');
            },
            addresses(value) {
                return gettextCatalog.getString('{{value}} addresses', { value }, 'Custom pro plan dashboard');
            }
        };
        return pmModal({
            controllerAs: 'ctrl',
            templateUrl: 'templates/dashboard/customProPlanModal.tpl.html',
            /* @ngInject */
            controller: function (params) {
                this.sliders = customProPlanModel.getSliders();
                this.format = (type) => I18N[type](this.sliders[type].value);
                this.close = () => params.close();
                this.submit = () => {
                    customProPlanModel.send();
                    params.close();
                };
            }
        });
    });
