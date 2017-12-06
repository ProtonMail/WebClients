import HeaderController from './controllers/header';
import ResetController from './controllers/reset';
import SecuredController from './controllers/secured';
import SetupController from './controllers/setup';
import SignupController from './controllers/signup';
import SupportController from './controllers/support';
import cardPanel from './directives/cardPanel';
import hideUpgrade from './directives/hideUpgrade';
import paginator from './directives/paginator';
import paginatorScope from './directives/paginatorScope';
import placeholderProgress from './directives/placeholderProgress';
import formatResponseInterceptor from './interceptors/formatResponseInterceptor';
import alertModal from './factories/alertModal';
import browserFingerprint from './factories/browserFingerprint';
import bugModal from './factories/bugModal';
import cardModal from './factories/cardModal';
import checkTypoEmails from './factories/checkTypoEmails';
import confirmModal from './factories/confirmModal';
import consoleMessage from './factories/consoleMessage';
import csv from './factories/csv';
import csvFormat from './factories/csvFormat';
import customizeInvoiceModal from './factories/customizeInvoiceModal';
import deleteAccountModal from './factories/deleteAccountModal';
import dkimModal from './factories/dkimModal';
import dmarcModal from './factories/dmarcModal';
import domainModal from './factories/domainModal';
import donateModal from './factories/donateModal';
import downloadFile from './factories/downloadFile';
import exceptionHandler from './factories/exceptionHandler';
import feedbackModal from './factories/feedbackModal';
import hotkeyModal from './factories/hotkeyModal';
import humanVerificationModal from './factories/humanVerificationModal';
import logoutManager from './factories/logoutManager';
import mxModal from './factories/mxModal';
import reactivateModal from './factories/reactivateModal';
import recoveryCodeModal from './factories/recoveryCodeModal';
import sharedSecretModal from './factories/sharedSecretModal';
import signatureModal from './factories/signatureModal';
import spfModal from './factories/spfModal';
import supportModal from './factories/supportModal';
import switchPasswordModeModal from './factories/switchPasswordModeModal';
import twoFAIntroModal from './factories/twoFAIntroModal';
import vcard from './factories/vcard';
import verificationModal from './factories/verificationModal';
import welcomeModal from './factories/welcomeModal';
import cache from './services/cache';
import cacheCounters from './services/cacheCounters';
import cachePages from './services/cachePages';
import paginationModel from './services/paginationModel';

export default angular
    .module('proton.core', ['proton.constants', 'proton.utils'])
    .run((paginationModel, cachePages) => {
        paginationModel.init();
        cachePages.init();
    })
    .controller('HeaderController', HeaderController)
    .controller('ResetController', ResetController)
    .controller('SecuredController', SecuredController)
    .controller('SetupController', SetupController)
    .controller('SignupController', SignupController)
    .controller('SupportController', SupportController)
    .directive('cardPanel', cardPanel)
    .directive('hideUpgrade', hideUpgrade)
    .directive('paginator', paginator)
    .directive('paginatorScope', paginatorScope)
    .directive('placeholderProgress', placeholderProgress)
    .factory('formatResponseInterceptor', formatResponseInterceptor)
    .factory('alertModal', alertModal)
    .factory('browserFingerprint', browserFingerprint)
    .factory('bugModal', bugModal)
    .factory('cardModal', cardModal)
    .factory('checkTypoEmails', checkTypoEmails)
    .factory('confirmModal', confirmModal)
    .factory('consoleMessage', consoleMessage)
    .factory('csv', csv)
    .factory('csvFormat', csvFormat)
    .factory('customizeInvoiceModal', customizeInvoiceModal)
    .factory('deleteAccountModal', deleteAccountModal)
    .factory('dkimModal', dkimModal)
    .factory('dmarcModal', dmarcModal)
    .factory('domainModal', domainModal)
    .factory('donateModal', donateModal)
    .factory('downloadFile', downloadFile)
    .factory('exceptionHandler', exceptionHandler)
    .factory('feedbackModal', feedbackModal)
    .factory('hotkeyModal', hotkeyModal)
    .factory('humanVerificationModal', humanVerificationModal)
    .factory('logoutManager', logoutManager)
    .factory('mxModal', mxModal)
    .factory('reactivateModal', reactivateModal)
    .factory('recoveryCodeModal', recoveryCodeModal)
    .factory('sharedSecretModal', sharedSecretModal)
    .factory('signatureModal', signatureModal)
    .factory('spfModal', spfModal)
    .factory('supportModal', supportModal)
    .factory('switchPasswordModeModal', switchPasswordModeModal)
    .factory('twoFAIntroModal', twoFAIntroModal)
    .factory('vcard', vcard)
    .factory('verificationModal', verificationModal)
    .factory('welcomeModal', welcomeModal)
    .factory('cache', cache)
    .factory('cacheCounters', cacheCounters)
    .factory('cachePages', cachePages)
    .factory('paginationModel', paginationModel).name;
