import pmMeBtn from './directives/pmMeBtn';
import pmMeTooltip from './directives/pmMeTooltip';
import pmMeView from './directives/pmMeView';
import pmMeModel from './factories/pmMeModel';

export default angular
    .module('proton.pmMe', [])
    .directive('pmMeBtn', pmMeBtn)
    .directive('pmMeTooltip', pmMeTooltip)
    .directive('pmMeView', pmMeView)
    .factory('pmMeModel', pmMeModel).name;
