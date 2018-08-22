/* @ngInject */
function openVpnSection(changeVPNNameModal, changeVPNPasswordModal, vpnSettingsModel) {
    const SHOW_PASSWORD_CLASS = 'openVpnSection-show-password';
    const togglePassword = (element) => element.classList.toggle(SHOW_PASSWORD_CLASS);
    const changeName = (scope) => {
        const params = {
            name: scope.VPNName,
            close(newName) {
                if (newName) {
                    scope.$applyAsync(() => {
                        scope.VPNName = newName;
                    });
                }
                changeVPNNameModal.deactivate();
            }
        };
        changeVPNNameModal.activate({ params });
    };

    const changePassword = (scope) => {
        const params = {
            password: scope.VPNPassword,
            close(newPassword) {
                if (newPassword) {
                    scope.$applyAsync(() => {
                        scope.VPNPassword = newPassword;
                    });
                }
                changeVPNPasswordModal.deactivate();
            }
        };
        changeVPNPasswordModal.activate({ params });
    };

    return {
        restrict: 'E',
        replace: true,
        scope: {},
        templateUrl: require('../../../templates/vpn/openVpnSection.tpl.html'),
        link(scope, el) {
            const { Name, Password } = vpnSettingsModel.get();

            scope.VPNName = Name;
            scope.VPNPassword = Password;

            const onClick = ({ target }) => {
                const action = target.getAttribute('data-action');

                switch (action) {
                    case 'changeName':
                        changeName(scope);
                        break;
                    case 'changePassword':
                        changePassword(scope);
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
