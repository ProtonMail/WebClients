angular.module('proton.ui')
    .directive('progressionBtn', ($rootScope) => ({
        replace: true,
        template: '<a class="progressionBtn-btn"><i class="fa fa-times"></i></a>',
        link(scope, el, { action = '' }) {
            el[0].setAttribute('data-label', action);

            const onClick = () => {
                $rootScope.$emit('attachment.upload', {
                    type: action,
                    data: scope.model
                });
            };

            el.on('click', onClick);

            scope
                .$on('$destroy', () => {
                    el.off('click', onClick);
                });
        }
    }));
