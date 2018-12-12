/* @ngInject */
function sessionLogsTable() {
    return {
        scope: {
            model: '='
        },
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/security/sessionLogsTable.tpl.html')
    };
}
export default sessionLogsTable;
