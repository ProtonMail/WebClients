angular.module('proton.formUtils')
    .directive('scrollToInvalid', () => {
        return {
            restrict: 'A',
            scope: {
                valid: '&scrollToInvalidOnValid'
            },
            link(scope, el) {

                function onSubmit() {
                    const firstInvalid = el[0].querySelector('.ng-invalid');
                    if (firstInvalid) {
                        firstInvalid.focus();
                        return false;
                    }
                    scope.valid();
                }

                el.on('submit', onSubmit);

                scope.$on('$destroy', () => {
                    el.off('submit', onSubmit);
                });
            }
        };
    });
