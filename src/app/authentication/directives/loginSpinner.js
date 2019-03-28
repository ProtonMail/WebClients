/* @ngInject */
const loginSpinner = () => {
    return {
        restrict: 'E',
        templateUrl: require('../../../templates/authentication/loginSpinner.tpl.html')
    };
};

export default loginSpinner;
