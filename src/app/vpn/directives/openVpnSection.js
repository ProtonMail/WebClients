/* @ngInject */
function openVpnSection(vpnSettingsModel, gettextCatalog, networkActivityTracker, eventManager, notification) {
    const SHOW_PASSWORD_CLASS = 'openVpnSection-show-password';
    const togglePassword = (element) => element.classList.toggle(SHOW_PASSWORD_CLASS);

    return {
        restrict: 'E',
        replace: true,
        scope: {},
        templateUrl: require('../../../templates/vpn/openVpnSection.tpl.html'),
        link(scope, el) {
            const { Name, Password } = vpnSettingsModel.get();

            scope.VPNName = Name;
            scope.VPNPassword = Password;

            const resetSettings = () => {
                const success = gettextCatalog.getString('OpenVPN / IKEv2 credentials regenerated', null, 'Info');

                const promise = vpnSettingsModel
                    .resetSettings()
                    .then(({ Name, Password }) => {
                        scope.$applyAsync(() => {
                            scope.VPNName = Name;
                            scope.VPNPassword = Password;
                        });

                        return eventManager.call();
                    })
                    .then(() => notification.success(success));

                networkActivityTracker.track(promise);
            };

            const onClick = ({ target }) => {
                const action = target.getAttribute('data-action');

                switch (action) {
                    case 'resetSettings':
                        resetSettings();
                        break;
                    case 'togglePassword':
                        togglePassword(el[0]);
                        break;
                    default:
                        break;
                }
            };

            el.on('click', onClick);

            scope.$on('$destroy', () => {
                el.off('click', onClick);
            });
        }
    };
}
export default openVpnSection;
