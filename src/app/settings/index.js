import settingsApi from './factories/settingsApi';
import settingsMailApi from './factories/settingsMailApi';
import userSettingsModel from './factories/userSettingsModel';
import vpnSettingsModel from './factories/vpnSettingsModel';
import mailSettingsModel from './factories/mailSettingsModel';
import sharedSecretModal from './modals/sharedSecretModal';
import vpnSettingsApi from './factories/vpnSettingsApi';
import composerSettings from './services/composerSettings';

export default angular
    .module('proton.settings', [])
    .factory('vpnSettingsApi', vpnSettingsApi)
    .factory('sharedSecretModal', sharedSecretModal)
    .factory('settingsApi', settingsApi)
    .factory('settingsMailApi', settingsMailApi)
    .factory('userSettingsModel', userSettingsModel)
    .factory('vpnSettingsModel', vpnSettingsModel)
    .factory('composerSettings', composerSettings)
    .factory('mailSettingsModel', mailSettingsModel).name;
