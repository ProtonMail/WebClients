import defaultSignature from './directives/defaultSignature';
import humanVerification from './directives/humanVerification';
import signupCreationProcess from './directives/signupCreationProcess';
import signupHumanForm from './directives/signupHumanForm';
import signupLink from './directives/signupLink';
import signupPayForm from './directives/signupPayForm';
import signupStepLink from './directives/signupStepLink';
import signupUserForm from './directives/signupUserForm';
import usernameDomain from './directives/usernameDomain';
import usernamePassword from './directives/usernamePassword';
import displayNameSignature from './directives/displayNameSignature';
import generateKeyModel from './factories/generateKeyModel';
import signatureModel from './factories/signatureModel';
import deleteAccountModal from './modals/deleteAccountModal';
import abuseFraudModal from './modals/abuseFraudModal';
import generateModal from './modals/generateModal';
import attachSignupSubscription from './services/attachSignupSubscription';
import isDelinquent from './services/isDelinquent';
import manageUser from './services/manageUser';
import signupModel from './services/signupModel';
import signupUserProcess from './services/signupUserProcess';
import userType from './services/userType';

export default angular
    .module('proton.user', [])
    .service('userType', userType)
    .directive('defaultSignature', defaultSignature)
    .directive('humanVerification', humanVerification)
    .directive('signupCreationProcess', signupCreationProcess)
    .directive('signupHumanForm', signupHumanForm)
    .directive('signupLink', signupLink)
    .directive('signupPayForm', signupPayForm)
    .directive('signupStepLink', signupStepLink)
    .directive('signupUserForm', signupUserForm)
    .directive('usernameDomain', usernameDomain)
    .directive('usernamePassword', usernamePassword)
    .directive('displayNameSignature', displayNameSignature)
    .factory('abuseFraudModal', abuseFraudModal)
    .factory('generateKeyModel', generateKeyModel)
    .factory('signatureModel', signatureModel)
    .factory('deleteAccountModal', deleteAccountModal)
    .factory('generateModal', generateModal)
    .factory('attachSignupSubscription', attachSignupSubscription)
    .factory('isDelinquent', isDelinquent)
    .factory('manageUser', manageUser)
    .factory('signupModel', signupModel)
    .factory('signupUserProcess', signupUserProcess).name;
