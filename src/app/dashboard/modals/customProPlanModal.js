/* @ngInject */
function customProPlanModal(customProPlanModel, gettextCatalog, translator, pmModal) {
    const I18N = translator(() => ({
        members(value) {
            return gettextCatalog.getPlural(value, '1 user', '{{$count}} users', {}, 'Custom pro plan dashboard');
        },
        storage(value) {
            return gettextCatalog.getString('{{value}} GB storage', { value }, 'Custom pro plan dashboard');
        },
        addresses(value) {
            return gettextCatalog.getString('{{value}} addresses', { value }, 'Custom pro plan dashboard');
        }
    }));

    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/dashboard/customProPlanModal.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            customProPlanModel.init();
            this.sliders = customProPlanModel.getSliders();
            this.format = (type) => I18N[type](this.sliders[type].value);
            this.close = () => params.close();

            this.needMore = () => {
                customProPlanModel.increaseRanges();
                this.needMoreMember = true;
            };

            this.submit = () => {
                customProPlanModel.send();
                params.close();
            };

            if (customProPlanModel.needMoreMember()) {
                this.needMore();
            }
        }
    });
}
export default customProPlanModal;
