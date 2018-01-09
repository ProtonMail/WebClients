/* @ngInject */
function contactAddressInput() {
    const DEFAULT = 'contactAddressInput-default';
    const STREET = 'contactAddressInput-street';
    const FIELD = 'contactAddressInput-field';
    const FOCUSSED = 'contactAddressInput-focussed';
    const SHOW_POST_BOX = 'contactAddressInput-show-post-box';
    const SHOW_EXTENDED = 'contactAddressInput-show-extended';
    const DELAY = 200;

    return {
        restrict: 'E',
        replace: true,
        scope: {
            value: '=',
            form: '=',
            focused: '='
        },
        templateUrl: require('../../../templates/contact/contactAddressInput.tpl.html'),
        link(scope, element) {
            const defaultInput = element.find(`.${DEFAULT}`);
            const defaultValue = Array.isArray(scope.value) && scope.value.length > 1 ? scope.value : ['', '', scope.value];

            const [
                postBoxValue = '',
                extendedValue = '',
                streetValue = '',
                localityValue = '',
                regionValue = '',
                postalCodeValue = '',
                countryValue = ''
            ] = defaultValue;
            const fields = element.find(`.${FIELD}`);
            const formatDefaultValue = (values = scope.value) => {
                return values.filter((value = '') => value.trim()).join('\n');
            };

            function onFocus() {
                element.addClass(FOCUSSED);
                setTimeout(() => element.find(`.${STREET}`).focus(), DELAY);
                scope.$applyAsync(() => (scope.focused = true));
            }

            function onBlur() {
                setTimeout(() => {
                    if (element.find(`.${FIELD}:focus`).length) {
                        return;
                    }
                    element.removeClass(FOCUSSED);
                    scope.$applyAsync(() => (scope.focused = false));
                }, DELAY);
            }

            function onChange() {
                scope.$applyAsync(() => {
                    const { postBox, extended, street, locality, region, postalCode, country } = scope.model;

                    scope.value = [postBox, extended, street, locality, region, postalCode, country];
                    scope.model.default = formatDefaultValue();
                });
            }

            scope.model = {
                default: formatDefaultValue(defaultValue),
                postBox: postBoxValue,
                extended: extendedValue,
                street: streetValue,
                locality: localityValue,
                region: regionValue,
                postalCode: postalCodeValue,
                country: countryValue
            };

            postBoxValue.length && element.addClass(SHOW_POST_BOX);
            extendedValue.length && element.addClass(SHOW_EXTENDED);

            defaultInput.on('focus', onFocus);
            fields.on('change', onChange);
            fields.on('blur', onBlur);

            scope.$on('$destroy', () => {
                defaultInput.off('focus', onFocus);
                fields.off('change', onChange);
                fields.off('blur', onBlur);
            });
        }
    };
}
export default contactAddressInput;
