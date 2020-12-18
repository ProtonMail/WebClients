import openVpnSection from './directives/openVpnSection';
import vpnRessources from './directives/vpnRessources';
import vpnView from './directives/vpnView';
import vpnApi from './factories/vpnApi';

export default angular
    .module('proton.vpn', [])
    .factory('vpnApi', vpnApi)
    .directive('openVpnSection', openVpnSection)
    .directive('vpnRessources', vpnRessources)
    .directive('vpnView', vpnView)
    .name;
