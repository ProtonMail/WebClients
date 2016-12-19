angular.module('proton.formUtils')
.directive('scrollToInvalid', () => {
    return {
        scope: {
            valid: '&'
        },
        link(scope, element) {
            element.bind('submit', () => {
                const firstInvalid = element[0].querySelector('.ng-invalid');
                if (firstInvalid) {
                    firstInvalid.focus();
                    return false;
                }
                scope.valid();
            });
        }
    };
});
