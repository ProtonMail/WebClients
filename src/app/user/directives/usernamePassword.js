/* @ngInject */
function usernamePassword() {
    return {
        replace: true,
        scope: {
            form: '=',
            model: '='
        },
        templateUrl: require('../../../templates/user/usernamePassword.tpl.html')
    };
}
export default usernamePassword;
