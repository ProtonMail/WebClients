import newBugReport from './directives/newBugReport';
import bugReportModel from './factories/bugReportModel';
import Report from './services/Report';
import bugReportApi from './services/bugReportApi';

export default angular
    .module('proton.bugReport', [])
    .run((bugReportModel) => bugReportModel.init())
    .directive('newBugReport', newBugReport)
    .factory('bugReportModel', bugReportModel)
    .factory('Report', Report)
    .factory('bugReportApi', bugReportApi).name;
