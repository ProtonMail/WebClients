import loginContainer from './directives/loginContainer';
import loginSubContainer from './directives/loginSubContainer';
import loginForm from './directives/loginForm';
import loginUnlockForm from './directives/loginUnlockForm';
import loginTwoFactorForm from './directives/loginTwoFactorForm';
import loginSpinner from './directives/loginSpinner';
import twoFaField from './directives/twoFaField';
import httpInterceptor from './interceptors/httpInterceptor';
import helpLoginModal from './modals/helpLoginModal';
import oldPasswordModal from './modals/oldPasswordModal';
import loginPasswordModal from './modals/loginPasswordModal';
import loginPasswordInput from './directives/loginPasswordInput';
import auth from './services/auth';
import authApi from './services/authApi';
import compatApi from './services/compatApi';
import handle401 from './services/handle401';
import handle429 from './services/handle429';
import unlockUser from './services/unlockUser';
import handle9001 from './services/handle9001';
import handle10003 from './services/handle10003';
import handleTryAgain from './services/handleTryAgain';
import logoutManager from './services/logoutManager';
import srp from './services/srp';
import tryAgainModel from './factories/tryAgainModel';
import activeSessionsModel from './factories/activeSessionsModel';

export default angular
    .module('proton.authentication', ['proton.utils', 'proton.keys'])
    // Global functions
    .run((AppModel, authentication) => {
        authentication.detectAuthenticationState();
    })
    .directive('loginForm', loginForm)
    .directive('loginContainer', loginContainer)
    .directive('loginSubContainer', loginSubContainer)
    .directive('loginUnlockForm', loginUnlockForm)
    .directive('loginPasswordInput', loginPasswordInput)
    .directive('loginTwoFactorForm', loginTwoFactorForm)
    .directive('loginSpinner', loginSpinner)
    .directive('twoFaField', twoFaField)
    .factory('httpInterceptor', httpInterceptor)
    .factory('helpLoginModal', helpLoginModal)
    .factory('oldPasswordModal', oldPasswordModal)
    .factory('loginPasswordModal', loginPasswordModal)
    .factory('logoutManager', logoutManager)
    .factory('authentication', auth)
    .factory('authApi', authApi)
    .factory('compatApi', compatApi)
    .factory('handle401', handle401)
    .factory('handle429', handle429)
    .factory('unlockUser', unlockUser)
    .factory('handle9001', handle9001)
    .factory('handle10003', handle10003)
    .factory('handleTryAgain', handleTryAgain)
    .factory('srp', srp)
    .factory('tryAgainModel', tryAgainModel)
    .factory('activeSessionsModel', activeSessionsModel).name;
