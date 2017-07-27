angular.module('proton.dashboard')
    .factory('customProPlanModal', (customProPlanModel, gettextCatalog, pmModal) => {
        return pmModal({
            controllerAs: 'ctrl',
            templateUrl: 'templates/dashboard/customProPlanModal.tpl.html',
            controller(params) {
                this.sliders = customProPlanModel.getSliders();
                this.close = () => params.close();
                this.submit = () => {
                    customProPlanModel.send();
                    params.close();
                };

                this.format = (type) => {
                    switch (type) {
                        case 'members':
                            return gettextCatalog.getPlural(this.sliders.members.value, '1 user', '{{$count}} users', {});
                        case 'storage':
                            return gettextCatalog.getString('{{value}} GB storage', { value: this.sliders.storage.value });
                        case 'addresses':
                            return gettextCatalog.getString('{{value}} addresses', { value: this.sliders.addresses.value });
                    }
                };
            }
        });
    });
