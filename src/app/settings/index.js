import AccountController from './controllers/account';
import AppearanceController from './controllers/appearance';
import DashboardController from './controllers/dashboard';
import DomainsController from './controllers/domains';
import LabelsController from './controllers/labels';
import MembersController from './controllers/members';
import PaymentsController from './controllers/payments';
import SecurityController from './controllers/security';
import SignaturesController from './controllers/signatures';
import chooseComposerMode from './directives/chooseComposerMode';
import chooseRightToLeft from './directives/chooseRightToLeft';
import headerBlock from './directives/headerBlock';
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
    .controller('AccountController', AccountController)
    .controller('AppearanceController', AppearanceController)
    .controller('DashboardController', DashboardController)
    .controller('DomainsController', DomainsController)
    .controller('LabelsController', LabelsController)
    .controller('MembersController', MembersController)
    .controller('PaymentsController', PaymentsController)
    .controller('SecurityController', SecurityController)
    .controller('SignaturesController', SignaturesController)
    .directive('chooseComposerMode', chooseComposerMode)
    .directive('chooseRightToLeft', chooseRightToLeft)
    .directive('headerBlock', headerBlock)
    .factory('sharedSecretModal', sharedSecretModal)
    .factory('settingsApi', settingsApi)
    .factory('settingsMailApi', settingsMailApi)
    .factory('userSettingsModel', userSettingsModel)
    .factory('vpnSettingsModel', vpnSettingsModel)
    .factory('composerSettings', composerSettings)
    .factory('mailSettingsModel', mailSettingsModel).name;
