angular.module('proton.contact')
    .directive('contactEncrypted', (gettextCatalog) => {
        const TOGGLE_BUTTON_CLASS = 'contactDetails-toggle-custom-fields';
        const SHOW_CLASS = 'contactDetails-show-custom-fields';
        const SHOW_TEXT_BUTTON = gettextCatalog.getString('Show custom fields', null, 'Action in contact details');
        const HIDE_TEXT_BUTTON = gettextCatalog.getString('Hide custom fields', null, 'Action in contact details');

        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'templates/contact/contactEncrypted.tpl.html',
            link(scope, element) {
                const button = element.find(`.${TOGGLE_BUTTON_CLASS}`);
                const updateText = () => button[0].textContent = element[0].classList.contains(SHOW_CLASS) ? HIDE_TEXT_BUTTON : SHOW_TEXT_BUTTON;
                const onClick = () => (element[0].classList.toggle(SHOW_CLASS), updateText());

                button.on('click', onClick);
                updateText();

                scope.$on('$destroy', () => button.off('click', onClick));
            }
        };
    });
