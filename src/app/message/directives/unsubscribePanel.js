angular.module('proton.message')
    .directive('unsubscribePanel', ($rootScope, gettextCatalog) => {
        const I18N = {
            notice: gettextCatalog.getString('This message is from a mailing list.', null, 'Info'),
            kb: gettextCatalog.getString('Learn more', null, 'Info'),
            button: gettextCatalog.getString('Unsubscribe', null, 'Action')
        };

        return {
            replace: true,
            restrict: 'E',
            template: `
                <div class="unsubscribePanel-container">
                    <div class="unsubscribePanel-notice">
                        <span class="unsubscribePanel-notice-text">${I18N.notice}</span>
                        <a class="unsubscribePanel-notice-link" href="https://protonmail.com/support/knowledge-base/auto-unsubscribe" target="_blank">${I18N.kb}</a>
                    </div>
                    <button type="button" class="unsubscribePanel-button pm_button">${I18N.button}</button>
                </div>
            `,
            link(scope, element) {
                const $button = element.find('.unsubscribePanel-button');
                const onClick = () => $rootScope.$emit('message', { type: 'unsubscribe', data: { message: scope.message } });

                $button.on('click', onClick);
                scope.$on('$destroy', () => $button.off('click', onClick));
            }
        };
    });
