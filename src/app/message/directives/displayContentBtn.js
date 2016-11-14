angular.module('proton.message')
.directive('displayContentBtn', ($rootScope, gettextCatalog) => {

    const LABELS = {
        embedded: gettextCatalog.getString('Load embedded images', null, 'Action'),
        remote: gettextCatalog.getString('Load remote content', null, 'Action')
    };

    const getClassName = (name) => `displayContentBtn-type-${name}`;

    return {
        replace: true,
        templateUrl: 'templates/message/displayContentBtn.tpl.html',
        link(scope, el, { action = 'remote' }) {
            const $label = el[0].querySelector('.displayContentBtn-label');
            $label.textContent = LABELS[action];

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

            el.on('click', onClick);

            scope.$on('$destroy', () => {
                el.off('click', onClick);
            });
        }
    };
});
