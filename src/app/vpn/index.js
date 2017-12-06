import openVpnSection from './directives/openVpnSection';
import vpnRessources from './directives/vpnRessources';
import vpnView from './directives/vpnView';
import changeVPNNameModal from './factories/changeVPNNameModal';
import changeVPNPasswordModal from './factories/changeVPNPasswordModal';
import vpnApi from './factories/vpnApi';
import vpnModel from './factories/vpnModel';

export default angular
    .module('proton.vpn', [])
    .directive('openVpnSection', openVpnSection)
    .directive('vpnRessources', vpnRessources)
    .directive('vpnView', vpnView)
    .factory('changeVPNNameModal', changeVPNNameModal)
    .factory('changeVPNPasswordModal', changeVPNPasswordModal)
    .factory('vpnApi', vpnApi)
    .factory('vpnModel', vpnModel).name;
