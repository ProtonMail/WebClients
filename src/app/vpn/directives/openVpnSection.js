/* @ngInject */
function openVpnSection(vpnModel, changeVPNNameModal, changeVPNPasswordModal) {
    return {
        restrict: 'E',
        replace: true,
        scope: {},
        templateUrl: require('../../../templates/vpn/openVpnSection.tpl.html'),
        link(scope) {
            vpnModel.fetch().then(({ Name, Password }) => {
                scope.VPNName = Name;
                scope.VPNPassword = Password;
            });

            scope.changeName = () => {
                const params = {
                    name: scope.VPNName,
                    close(newName) {
                        if (newName) {
                            scope.VPNName = newName;
                        }
                        changeVPNNameModal.deactivate();
                    }
                };
                changeVPNNameModal.activate({ params });
            };

            scope.changePassword = () => {
                const params = {
                    password: scope.VPNPassword,
                    close(newPassword) {
                        if (newPassword) {
                            scope.VPNPassword = newPassword;
                        }
                        changeVPNPasswordModal.deactivate();
                    }
                };
                changeVPNPasswordModal.activate({ params });
            };
        }
    };
}
export default openVpnSection;
