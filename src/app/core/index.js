import HeaderController from './controllers/header';
import SecuredController from './controllers/secured';
import SetupController from './controllers/setup';
import SignupController from './controllers/signup';
import SupportController from './controllers/support';
import hideUpgrade from './directives/hideUpgrade';
import placeholderProgress from './directives/placeholderProgress';
import formatResponseInterceptor from './interceptors/formatResponseInterceptor';
import alertModal from './factories/alertModal';
import browserFingerprint from './factories/browserFingerprint';
import bugModal from './factories/bugModal';
import releaseNotesModal from './factories/releaseNotesModal';
import confirmModal from './factories/confirmModal';
import csv from './factories/csv';
import csvFormat from './factories/csvFormat';
import downloadFile from './factories/downloadFile';
import exceptionHandler from './factories/exceptionHandler';
import feedbackModal from './factories/feedbackModal';
import hotkeyModal from './factories/hotkeyModal';
import humanVerificationModal from './factories/humanVerificationModal';
import reactivateModal from './factories/reactivateModal';
import recoveryCodeModal from './factories/recoveryCodeModal';
import supportModal from './factories/supportModal';
import switchPasswordModeModal from './factories/switchPasswordModeModal';
import twoFAIntroModal from './factories/twoFAIntroModal';
import vcard from './factories/vcard';
import verificationModal from './factories/verificationModal';
import welcomeModal from './factories/welcomeModal';
import SidebarController from './controllers/sidebar';

export default angular
    .module('proton.core', ['proton.constants', 'proton.utils'])
    .run((paginationModel, cachePages) => {
        paginationModel.init();
        cachePages.init();
    })
    .controller('SidebarController', SidebarController)
    .controller('HeaderController', HeaderController)
    .controller('SecuredController', SecuredController)
    .controller('SetupController', SetupController)
    .controller('SignupController', SignupController)
    .controller('SupportController', SupportController)
    .directive('hideUpgrade', hideUpgrade)
    .directive('placeholderProgress', placeholderProgress)
    .factory('formatResponseInterceptor', formatResponseInterceptor)
    .factory('alertModal', alertModal)
    .factory('browserFingerprint', browserFingerprint)
    .factory('bugModal', bugModal)
    .factory('confirmModal', confirmModal)
    .factory('releaseNotesModal', releaseNotesModal)
    .factory('csv', csv)
    .factory('csvFormat', csvFormat)
    .factory('downloadFile', downloadFile)
    .factory('$exceptionHandler', exceptionHandler)
    .factory('feedbackModal', feedbackModal)
    .factory('hotkeyModal', hotkeyModal)
    .factory('humanVerificationModal', humanVerificationModal)
    .factory('reactivateModal', reactivateModal)
    .factory('recoveryCodeModal', recoveryCodeModal)
    .factory('supportModal', supportModal)
    .factory('switchPasswordModeModal', switchPasswordModeModal)
    .factory('twoFAIntroModal', twoFAIntroModal)
    .factory('vcard', vcard)
    .factory('verificationModal', verificationModal)
    .factory('welcomeModal', welcomeModal).name;
