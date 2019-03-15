/* @ngInject */
function confirmModal(pmModal, gettextCatalog, translator) {
    const I18N = translator(() => ({
        confirm: gettextCatalog.getString('Confirm', null, 'Default text for the confirm button in the confirm modal'),
        cancel: gettextCatalog.getString('Cancel', null, 'Default text for the cancel button in the confirm modal')
    }));

    const getClassName = ({ isDanger = false, isWarning = false } = {}) => {
        const danger = isDanger && 'alert-danger';
        const warning = isWarning && 'alert-warning';
        return ['alert', danger, warning].filter(Boolean).join(' ');
    };

    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/confirm.tpl.html'),
        /* @ngInject */
        controller: function(params, hotkeys) {
            hotkeys.unbind(['enter']);
            this.title = params.title;
            this.icon = params.icon;
            this.learnMore = params.learnMore;
            this.message = params.message;
            this.confirmText = params.confirmText || I18N.confirm;
            this.hideClose = params.hideClose;
            this.classNameMessage = getClassName(params);
            this.class = params.class;
            this.cancelText = params.cancelText || I18N.cancel;
            this.confirm = () => (hotkeys.bind(['enter']), params.confirm());
            this.cancel = (type = 'cross') => (hotkeys.bind(['enter']), params.cancel(type));

            // The button is not directly available
            setTimeout(() => angular.element('#confirmModalBtn').focus(), 100);
        }
    });
}
export default confirmModal;
