import settingsApi from './factories/settingsApi';
import settingsMailApi from './factories/settingsMailApi';
import userSettingsModel from './factories/userSettingsModel';
import vpnSettingsModel from './factories/vpnSettingsModel';
import mailSettingsModel from './factories/mailSettingsModel';
import vpnSettingsApi from './factories/vpnSettingsApi';

export default angular
    .module('proton.settings', [])
    .factory('vpnSettingsApi', vpnSettingsApi)
    .factory('settingsApi', settingsApi)
    .factory('settingsMailApi', settingsMailApi)
    .factory('userSettingsModel', userSettingsModel)
    .factory('vpnSettingsModel', vpnSettingsModel)
    .factory('mailSettingsModel', mailSettingsModel).name;
