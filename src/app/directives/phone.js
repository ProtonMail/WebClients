angular.module('proton.phone', [])

.directive('phone', ($timeout) => {
    return {
        restrict: 'A',
        require: '^ngModel',
        scope: {
            ngModel: '=',
            country: '='
        },
        link(scope, element, attrs, ctrl) {
            if (element.val() !== '') {
                $timeout(() => {
                    element.intlTelInput('setNumber', element.val());

                    return ctrl.$setViewValue(element.val());
                }, 0);
            }

            const read = function () {
                const value = element.intlTelInput('getNumber');

                ctrl.$setViewValue(value);
            };

            const watchOnce = scope.$watch('ngModel', (newValue) => {
                return scope.$$postDigest(() => {
                    if (newValue) {
                        ctrl.$modelValue = (newValue[0] !== '+') ? `+ ${newValue}` : newValue;
                    }

                    element.intlTelInput();
                    element.intlTelInput('loadUtils', '/src/app/libraries/utils.js');

                    return watchOnce();
                });
            });

            scope.$watch('country', (newValue) => {
                if (newValue) {
                    return element.intlTelInput('selectCountry', newValue);
                }
            });

            ctrl.$formatters.push((value) => {
                if (!value) {
                    return value;
                }

                element.intlTelInput('setNumber', value);

                return element.val();
            });

            ctrl.$parsers.push((value) => {
                if (!value) {
                    return value;
                }

                return value.replace(/[^\d|+]/g, '');
            });

            element.on('blur keyup change', () => {
                scope.$apply(read);
            });

            scope.$on('$destroy', () => {
                element.intlTelInput('destroy');
                element.off('blur keyup change');
            });
        }
    };
});
