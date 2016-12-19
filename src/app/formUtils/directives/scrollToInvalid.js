angular.module('proton.formUtils')
.directive('scrollToInvalid', () => {
    return {
        scope: {
            valid: '&'
        },
        link(scope, el) {
            const onSubmit = () => {
                const firstInvalid = el[0].querySelector('.ng-invalid');
                if (firstInvalid) {
                    firstInvalid.focus();
                    return false;
                }
                scope.valid();
            };

            el.on('submit', onSubmit);

            scope.$on('$destroy', () => {
                el.off('submit', onSubmit);
            });
        }
    };
});
