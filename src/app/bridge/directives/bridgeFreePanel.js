/* @ngInject */
function bridgeFreePanel(gettextCatalog, notification, translator) {
    const I18N = translator(() => ({
        info: gettextCatalog.getString('This feature is only available for paid users.', null, 'Info')
    }));
    const onClick = () => notification.info(I18N.info);
    return {
        replace: true,
        restrict: 'E',
        scope: {},
        templateUrl: require('../../../templates/bridge/bridgeFreePanel.tpl.html'),
        link(scope, el) {
            const $btn = el.find('.bridgeFreePanel-btn');

            $btn.on('click', onClick);

            scope.$on('$destroy', () => {
                $btn.off('click', onClick);
            });
        }
    };
}
export default bridgeFreePanel;
