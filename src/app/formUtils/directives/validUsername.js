import _ from 'lodash';

/* @ngInject */
function validUsername() {
    const IS_VALID = new RegExp(/^[A-Za-z0-9]+(?:[_.-][A-Za-z0-9]+)*$/);

    return {
        require: 'ngModel',
        restrict: 'A',
        link(scope, el, attr, ngModel) {
            ngModel.$validators.valid = (input) => IS_VALID.test(input);
        }
    };
}
export default validUsername;
