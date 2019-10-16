import sieveLabelInput from './directives/sieveLabelInput';
import filterModal from './modals/filterModal';
import sieveLint from './services/sieveLint';
import simpleFilter from './services/simpleFilter';
import filterValidator from './services/filterValidator';

export default angular
    .module('proton.filter', ['proton.utils'])
    .factory('simpleFilter', simpleFilter)
    .factory('filterValidator', filterValidator)
    .directive('sieveLabelInput', sieveLabelInput)
    .factory('filterModal', filterModal)
    .factory('sieveLint', sieveLint).name;
