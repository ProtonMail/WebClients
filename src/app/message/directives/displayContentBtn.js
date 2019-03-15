/* @ngInject */
function displayContentBtn(dispatchers, gettextCatalog, translator) {
    const I18N = translator(() => ({
        embedded: gettextCatalog.getString('This message contains embedded images', null, 'Action'),
        remote: gettextCatalog.getString('This message contains remote content', null, 'Action')
    }));

    const getClassName = (name) => `displayContentBtn-type-${name}`;

    return {
        replace: true,
        templateUrl: require('../../../templates/message/displayContentBtn.tpl.html'),
        link(scope, el, { action = 'remote' }) {
            const { dispatcher } = dispatchers(['message.open']);
            const $notice = el[0].querySelector('.displayContentBtn-notice-text');
            const $btn = el.find('.displayContentBtn-button');
            $notice.textContent = I18N[action];

            const onClick = () => {
                dispatcher['message.open']('injectContent', {
                    message: scope.message,
                    action
                });
                el[0].classList.remove(getClassName(action));
            };

            $btn.on('click', onClick);

            scope.$on('$destroy', () => {
                $btn.off('click', onClick);
            });
        }
    };
}
export default displayContentBtn;
