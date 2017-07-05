angular.module('proton.message')
    .directive('unsubscribePanel', ($rootScope, $timeout, gettextCatalog) => {
        const I18N = {
            notice: gettextCatalog.getString('This message is from a mailing list.', null, 'Info'),
            button: gettextCatalog.getString('Unsubscribe', null, 'Action')
        };

        return {
            replace: true,
            restrict: 'E',
            template: `
                <div class="unsubscribePanel-container">
                    <span class="unsubscribePanel-notice">${I18N.notice}</span>
                    <button class="unsubscribePanel-button pm_button">${I18N.button}</button>
                </div>
            `,
            link(scope, element) {
                const $button = element.find('.unsubscribePanel-button');
                const onClick = () => {
                    $rootScope.$emit('message', { type: 'unsubscribe', data: { message: scope.message } });
                };

                $button.on('click', onClick);
                scope.$on('$destroy', () => $button.off('click', onClick));
            }
        };
    });
