import pmMeBtn from './directives/pmMeBtn';
import pmMeView from './directives/pmMeView';
import pmMeModel from './factories/pmMeModel';

export default angular
    .module('proton.pmMe', [])
    .directive('pmMeBtn', pmMeBtn)
    .directive('pmMeView', pmMeView)
    .factory('pmMeModel', pmMeModel).name;
