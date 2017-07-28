angular.module('proton.message')
    .directive('displayContentBtn', ($rootScope, gettextCatalog) => {

        const NOTICES = {
            embedded: gettextCatalog.getString('This message contains embedded images', null, 'Action'),
            remote: gettextCatalog.getString('This message contains remote content', null, 'Action')
        };

        const getClassName = (name) => `displayContentBtn-type-${name}`;

        return {
            replace: true,
            templateUrl: 'templates/message/displayContentBtn.tpl.html',
            link(scope, el, { action = 'remote' }) {
                const $notice = el[0].querySelector('.displayContentBtn-notice-text');
                const $btn = el.find('.displayContentBtn-button');
                $notice.textContent = NOTICES[action];

                const onClick = () => {
                    $rootScope.$emit('message.open', {
                        type: 'injectContent',
                        data: {
                            message: scope.message,
                            action
                        }
                    });
                    el[0].classList.remove(getClassName(action));
                };

                $btn.on('click', onClick);

                scope.$on('$destroy', () => {
                    $btn.off('click', onClick);
                });
            }
        };
    });
