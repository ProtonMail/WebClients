import logManager from './directives/logManager';
import sessionLogsTable from './directives/sessionLogsTable';
import logsModel from './factories/logsModel';

angular
    .module('proton.security', [])
    .directive('sessionLogsTable', sessionLogsTable)
    .directive('logManager', logManager)
    .factory('logsModel', logsModel);

export default angular.module('proton.security').name;
