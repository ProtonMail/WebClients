/* @ngInject */
function usernameDomain() {
    return {
        replace: true,
        scope: {
            form: '=',
            model: '=',
            domains: '='
        },
        templateUrl: 'templates/user/usernameDomain.tpl.html'
    };
}
export default usernameDomain;
