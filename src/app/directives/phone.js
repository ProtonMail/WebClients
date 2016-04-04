angular.module('proton.phone', [])

.directive('phone', function($timeout) {
    return {
        restrict: 'A',
        require: '^ngModel',
        scope: {
            ngModel: '=',
            country: '='
        },
        link: function(scope, element, attrs, ctrl) {
            if (element.val() !== '') {
                $timeout(function() {
                    element.intlTelInput('setNumber', element.val());

                    return ctrl.$setViewValue(element.val());
                }, 0);
            }

            var read = function() {
                var value = element.intlTelInput('getNumber');

                ctrl.$setViewValue(value);
            };

            watchOnce = scope.$watch('ngModel', function(newValue) {
                return scope.$$postDigest(function() {
                    if (newValue !== null && newValue !== void 0 && newValue.length > 0) {
                        if (newValue[0] !== '+') {
                            newValue = '+' + newValue;
                        }

                        ctrl.$modelValue = newValue;
                    }

                    element.intlTelInput();
                    element.intlTelInput('loadUtils', '/src/app/libraries/utils.js');

                    return watchOnce();
                });
            });

            scope.$watch('country', function(newValue) {
                if (newValue !== null && newValue !== void 0 && newValue !== '') {
                    return element.intlTelInput('selectCountry', newValue);
                }
            });

            ctrl.$formatters.push(function(value) {
                if (!value) {
                    return value;
                }

                element.intlTelInput('setNumber', value);

                return element.val();
            });

            ctrl.$parsers.push(function(value) {
                if (!value) {
                    return value;
                }

                return value.replace(/[^\d|+]/g, '');
            });

            element.on('blur keyup change', function(event) {
                scope.$apply(read);
            });

            scope.$on('$destroy', function() {
                element.intlTelInput('destroy');
                element.off('blur keyup change');
            });
        }
    };
});
