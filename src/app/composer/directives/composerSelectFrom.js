angular.module('proton.composer')
    .directive('composerSelectFrom', (notify, authentication) => {

        const isIE = $.browser.msie && $.browser.versionNumber === 11;
        const listAddress = () => {
            return _.chain(authentication.user.Addresses)
                .where({ Status: 1, Receive: 1 })
                .sortBy('Send')
                .value();
        };

        return {
            scope: {
                message: '=model'
            },
            replace: true,
            templateUrl: 'templates/directives/composer/composerSelectFrom.tpl.html',
            link(scope, el) {
                const $select = el.find('select');
                scope.addresses = listAddress();

                const onClick = (e) => {
                    if (scope.message.Attachments.length) {
                        e.preventDefault();
                        return notify({
                            message: 'Attachments and inline images must be removed first before changing sender',
                            classes: 'notification-danger'
                        });
                    }
                };

                const onChange = () => {
                    scope.$applyAsync(() => {
                        scope.message.AddressID = scope.message.From.ID;
                        scope.message.editor && scope.message.editor.fireEvent('refresh', {
                            action: 'message.changeFrom'
                        });
                    });
                };

                /**
                 * For some reason IE focus is lost
                 * cause a rendering bug of the options widths
                 */
                const onMouseDown = () => $select.focus();
                isIE && $select.on('mousedown', onMouseDown);

                el.on('click', onClick);
                el.on('change', onChange);

                scope.$on('$destroy', () => {
                    isIE && $select.off('mousedown', onMouseDown);
                    el.off('click', onClick);
                    el.off('change', onChange);
                });
            }
        };
    });
