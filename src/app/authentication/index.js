import LoginController from './controllers/login';
import loginForm from './directives/loginForm';
import loginTwoFactorForm from './directives/loginTwoFactorForm';
import twoFaField from './directives/twoFaField';
import authHttpResponseInterceptor from './interceptors/authHttpResponseInterceptor';
import helpLoginModal from './modals/helpLoginModal';
import oldPasswordModal from './modals/oldPasswordModal';
import loginPasswordModal from './modals/loginPasswordModal';
import pmcw from './providers/pmcw';
import auth from './services/auth';
import authApi from './services/authApi';
import handle401 from './services/handle401';
import unlockUser from './services/unlockUser';
import handle9001 from './services/handle9001';
import handle10003 from './services/handle10003';
import logoutManager from './services/logoutManager';
import passwords from './services/passwords';
import srp from './services/srp';
import upgradePassword from './services/upgradePassword';

export default angular
    .module('proton.authentication', ['proton.constants', 'proton.utils', 'proton.keys'])
    // Global functions
    .run(($rootScope, authentication) => {
        authentication.detectAuthenticationState();
        $rootScope.isLoggedIn = authentication.isLoggedIn();
        $rootScope.isLocked = authentication.isLocked();
        $rootScope.isSecure = authentication.isSecured();
    })
    .controller('LoginController', LoginController)
    .directive('loginForm', loginForm)
    .directive('loginTwoFactorForm', loginTwoFactorForm)
    .directive('twoFaField', twoFaField)
    .factory('authHttpResponseInterceptor', authHttpResponseInterceptor)
    .factory('helpLoginModal', helpLoginModal)
    .factory('oldPasswordModal', oldPasswordModal)
    .factory('loginPasswordModal', loginPasswordModal)
    .factory('logoutManager', logoutManager)
    .provider('pmcw', pmcw)
    .factory('authentication', auth)
    .factory('authApi', authApi)
    .factory('handle401', handle401)
    .factory('unlockUser', unlockUser)
    .factory('handle9001', handle9001)
    .factory('handle10003', handle10003)
    .factory('passwords', passwords)
    .factory('srp', srp)
    .factory('upgradePassword', upgradePassword).name;
