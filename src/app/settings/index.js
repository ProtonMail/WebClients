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
import headerBlock from './directives/headerBlock';
import labelsEditorModel from './factories/labelsEditorModel';
import settingsApi from './factories/settingsApi';
import sharedSecretModal from './modals/sharedSecretModal';

export default angular
    .module('proton.settings', [])
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
    .directive('headerBlock', headerBlock)
    .factory('labelsEditorModel', labelsEditorModel)
    .factory('sharedSecretModal', sharedSecretModal)
    .factory('settingsApi', settingsApi).name;
