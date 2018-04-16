import { REGEX_EMAIL } from '../../constants';

/* @ngInject */
function validEmail() {

    /**
     * Default validator from Angular follows the RFC
     * cf https://github.com/angular/angular.js/issues/16379
     * BUT --- Nobody does ヘ（。□°）ヘ
     */
    const validator = (ngModel) => (input = '') => ngModel.$isEmpty(input) || REGEX_EMAIL.test(input);

    return {
        require: 'ngModel',
        restrict: 'A',
        link(scope, el, { type }, ngModel) {
            // Kiss solution as for contacts it's dynamic, prevent too much code
            if (type === 'email') {
                ngModel.$validators.email = validator(ngModel);
            }
        }
    };
}
export default validEmail;
