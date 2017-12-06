import newBugReport from './directives/newBugReport';
import bugReportModel from './factories/bugReportModel';
import Bug from './services/Bug';
import bugReportApi from './services/bugReportApi';

export default angular
    .module('proton.bugReport', [])
    .run((bugReportModel) => bugReportModel.init())
    .directive('newBugReport', newBugReport)
    .factory('bugReportModel', bugReportModel)
    .factory('Bug', Bug)
    .factory('bugReportApi', bugReportApi).name;
