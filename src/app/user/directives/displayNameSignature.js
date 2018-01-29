/* @ngInject */
function displayNameSignature() {
    return {
        scope: { model: '=' },
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/user/displayNameSignature.tpl.html')
    };
}

export default displayNameSignature;
