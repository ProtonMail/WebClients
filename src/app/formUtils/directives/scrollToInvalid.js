angular.module('proton.formUtils')
.directive('scrollToInvalid', () => {
    return {
        restrict: 'A',
        scope: {
            valid: '&'
        },
        link(scope, element) {
            const form = element[0];

            function onSubmit() {
                const firstInvalid = form.querySelector('.ng-invalid');
                if (firstInvalid) {
                    firstInvalid.focus();
                    return false;
                }
                scope.valid();
            }

            form.addEventListener('submit', onSubmit);

            scope.$on('$destroy', () => {
                form.removeEventListener('submit', onSubmit);
            });
        }
    };
});
