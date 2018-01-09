/* @ngInject */
function usernameDomain() {
    return {
        replace: true,
        scope: {
            form: '=',
            model: '=',
            domains: '='
        },
        templateUrl: require('../../../templates/user/usernameDomain.tpl.html')
    };
}
export default usernameDomain;
