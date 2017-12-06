import captcha from './directives/captcha';
import captchaView from './directives/captchaView';
import cardCvc from './directives/cardCvc';
import cardNumber from './directives/cardNumber';
import cardView from './directives/cardView';
import compareTo from './directives/compareTo';
import cvcTooltip from './directives/cvcTooltip';
import danger from './directives/danger';
import formIsInvalid from './directives/formIsInvalid';
import password from './directives/password';
import togglePassword from './directives/togglePassword';
import uniqueUsername from './directives/uniqueUsername';
import validRecovery from './directives/validRecovery';
import validUsername from './directives/validUsername';
import validatorTypoEmail from './directives/validatorTypoEmail';
import cardModel from './factories/cardModel';
import countriesListModel from './factories/countriesListModel';

export default angular
    .module('proton.formUtils', ['ngIntlTelInput'])
    .directive('captcha', captcha)
    .directive('captchaView', captchaView)
    .directive('cardCvc', cardCvc)
    .directive('cardNumber', cardNumber)
    .directive('cardView', cardView)
    .directive('compareTo', compareTo)
    .directive('cvcTooltip', cvcTooltip)
    .directive('danger', danger)
    .directive('formIsInvalid', formIsInvalid)
    .directive('password', password)
    .directive('togglePassword', togglePassword)
    .directive('uniqueUsername', uniqueUsername)
    .directive('validRecovery', validRecovery)
    .directive('validUsername', validUsername)
    .directive('validatorTypoEmail', validatorTypoEmail)
    .factory('cardModel', cardModel)
    .factory('countriesListModel', countriesListModel).name;
