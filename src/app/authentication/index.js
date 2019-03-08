import LoginController from './controllers/login';
import loginForm from './directives/loginForm';
import loginTwoFactorForm from './directives/loginTwoFactorForm';
import twoFaField from './directives/twoFaField';
import httpInterceptor from './interceptors/httpInterceptor';
import helpLoginModal from './modals/helpLoginModal';
import oldPasswordModal from './modals/oldPasswordModal';
import loginPasswordModal from './modals/loginPasswordModal';
import loginPasswordInput from './directives/loginPasswordInput';
import auth from './services/auth';
import authApi from './services/authApi';
import handle401 from './services/handle401';
import handle429 from './services/handle429';
import unlockUser from './services/unlockUser';
import handle9001 from './services/handle9001';
import handle10003 from './services/handle10003';
import handleTryAgain from './services/handleTryAgain';
import logoutManager from './services/logoutManager';
import srp from './services/srp';
import upgradePassword from './services/upgradePassword';
import tryAgainModel from './factories/tryAgainModel';
import loginWithFallback from './services/loginWithFallback';
import activeSessionsModel from './factories/activeSessionsModel';

export default angular
    .module('proton.authentication', ['proton.utils', 'proton.keys'])
    // Global functions
    .run((AppModel, authentication) => {
        authentication.detectAuthenticationState();
        AppModel.set('isLoggedIn', authentication.isLoggedIn());
        AppModel.set('isLocked', authentication.isLocked());
        AppModel.set('isSecure', authentication.isSecured());
    })
    .controller('LoginController', LoginController)
    .directive('loginForm', loginForm)
    .directive('loginPasswordInput', loginPasswordInput)
    .directive('loginTwoFactorForm', loginTwoFactorForm)
    .directive('twoFaField', twoFaField)
    .factory('httpInterceptor', httpInterceptor)
    .factory('helpLoginModal', helpLoginModal)
    .factory('oldPasswordModal', oldPasswordModal)
    .factory('loginPasswordModal', loginPasswordModal)
    .factory('logoutManager', logoutManager)
    .factory('authentication', auth)
    .factory('loginWithFallback', loginWithFallback)
    .factory('authApi', authApi)
    .factory('handle401', handle401)
    .factory('handle429', handle429)
    .factory('unlockUser', unlockUser)
    .factory('handle9001', handle9001)
    .factory('handle10003', handle10003)
    .factory('handleTryAgain', handleTryAgain)
    .factory('srp', srp)
    .factory('tryAgainModel', tryAgainModel)
    .factory('activeSessionsModel', activeSessionsModel)
    .factory('upgradePassword', upgradePassword).name;
