/* @ngInject */
function composerInputRecipient() {
    return {
        replace: true,
        templateUrl: require('../../../templates/directives/composer/composerInputRecipient.tpl.html'),
        scope: {
            email: '<',
            message: '<'
        }
    };
}

export default composerInputRecipient;
