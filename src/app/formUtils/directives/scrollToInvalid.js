angular.module('proton.formUtils')
.directive('scrollToInvalid', () => {
    return {
        scope: {
            valid: '&'
        },
        link(scope, element) {
            function onSubmit() {
                const firstInvalid = element[0].querySelector('.ng-invalid');
                if (firstInvalid) {
                    firstInvalid.focus();
                    return false;
                }
                scope.valid();
            }

            element.addEventListener('submit', onSubmit);

            scope.$on('$destroy', () => {
                element.removeEventListener('submit', onSubmit);
            });
        }
    };
});
