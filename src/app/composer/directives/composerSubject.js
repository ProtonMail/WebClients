angular.module('proton.composer')
    .directive('composerSubject', () => ({
        replace: true,
        templateUrl: 'templates/directives/composer/composerSubject.tpl.html',
        link(scope, el) {

            const $input = el[0].querySelector('input');

            const onFocus = () => {
                scope.$applyAsync(() => {
                    scope.message.autocompletesFocussed = false;
                    scope.message.ccbcc = false;
                    scope.message.attachmentsToggle = false;
                });
            };

            const onKeydown = _.throttle((e) => {
                // TAB
                if (e.which === 9 && scope.message.editor) {
                    e.preventDefault();
                    scope.message.editor.focus();
                }
            }, 150);

            $input.addEventListener('focus', onFocus, true);
            $input.addEventListener('keydown', onKeydown, false);

            scope.$on('$destroy', () => {
                $input.removeEventListener('focus', onFocus, true);
                $input.removeEventListener('keydown', onKeydown, false);
            });
        }
    }));
