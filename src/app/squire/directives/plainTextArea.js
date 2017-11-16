angular.module('proton.squire')
    .directive('plainTextArea', (authentication, $rootScope) => {

        const KEY = {
            ENTER: 13,
            S: 83
        };
        const isKey = (e, code) => (!e.altKey && (e.ctrlKey || e.metaKey) && e.keyCode === code);

        return {
            replace: true,
            templateUrl: 'templates/squire/plainTextArea.tpl.html',
            link(scope, el) {
                /*
                    Set the selection to the start instead of the end just like with squire.
                    only set it on first load as we should remember the location after first use.
                    (otherwise you start typing after the signature which is bad UX OR even worse after the reply chain)
                    we need to ensure the data is in there, to prevent the selection from changing after ng-model is applied
                 */
                el[0].value = scope.message.DecryptedBody;
                el[0].selectionStart = 0;
                el[0].selectionEnd = 0;

                _.has(scope.message, 'Action') && _rAF(() => el.focus());

                // proxy for autosave as Mousetrap doesn't work with iframe
                const onKeyDown = (e) => {
                    // Check alt too cf Polis S #5476
                    if (isKey(e, KEY.S)) {
                        e.preventDefault();
                        Mousetrap.trigger('meta+s');
                    }

                    if (isKey(e, KEY.ENTER) && authentication.user.Hotkeys === 1) {
                        $rootScope.$emit('composer.update', {
                            type: 'send.message',
                            data: { message: scope.message }
                        });
                    }
                };

                el.on('keydown', onKeyDown);

                scope.$on('$destroy', () => {
                    el.off('keydown', onKeyDown);
                });
            }
        };
    });
