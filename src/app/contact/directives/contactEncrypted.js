/* @ngInject */
function contactEncrypted(gettextCatalog, translator) {
    const TOGGLE_BUTTON_CLASS = 'contactDetails-toggle-custom-fields';
    const SHOW_CLASS = 'contactDetails-show-custom-fields';
    const I18N = translator(() => ({
        SHOW: gettextCatalog.getString('Show custom fields', null, 'Action in contact details'),
        HIDE: gettextCatalog.getString('Hide custom fields', null, 'Action in contact details')
    }));

    return {
        restrict: 'E',
        replace: true,
        templateUrl: require('../../../templates/contact/contactEncrypted.tpl.html'),
        link(scope, el) {
            const button = el.find(`.${TOGGLE_BUTTON_CLASS}`);
            const updateText = () => {
                const key = el[0].classList.contains(SHOW_CLASS) ? 'HIDE' : 'SHOW';
                button[0].textContent = I18N[key];
            };

            const onClick = () => (el[0].classList.toggle(SHOW_CLASS), updateText());

            button.on('click', onClick);
            updateText();

            scope.$on('$destroy', () => {
                button.off('click', onClick);
            });
        }
    };
}
export default contactEncrypted;
