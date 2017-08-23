angular.module('proton.ui')
    .directive('progressionBtn', ($rootScope) => ({
        replace: true,
        template: '<button type="button" class="progressionBtn-btn"><i class="fa fa-times"></i></button>',
        link(scope, el, { action = '' }) {
            el[0].setAttribute('data-label', action);

            const onClick = (e) => {
                e.stopPropagation();
                el[0].disabled = true;
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
