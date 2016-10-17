angular.module('proton.composer')
    .directive('composerEmailsPlaceholder', () => ({
        replace: true,
        templateUrl: 'templates/directives/composer/composerEmailsPlaceholder.tpl.html',
        link(scope, el) {

            const onClick = () => {
                scope.$applyAsync(() => {
                    scope.selected.autocompletesFocussed = true;
                    _rAF(() => el.find('input').focus());
                });
            };

            el.on('click', onClick);
            scope
                .$on('$destroy', () => {
                    el.off('click', onClick);
                });
        }
    }));
