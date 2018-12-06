import customFilterList from './directives/customFilterList';
import emailBlockButton from './directives/emailBlockButton';
import emailBlockList from './directives/emailBlockList';
import filterView from './directives/filterView';
import sieveLabelInput from './directives/sieveLabelInput';
import spamListSearch from './directives/spamListSearch';
import spamLists from './directives/spamLists';
import filterModal from './factories/filterModal';
import incomingModel from './factories/incomingModel';
import spamListModel from './factories/spamListModel';
import filterAddressModal from './modals/filterAddressModal';
import sieveLint from './services/sieveLint';
import filterValidator from './services/filterValidator';

export default angular
    .module('proton.filter', ['proton.utils'])
    .factory('filterValidator', filterValidator)
    .directive('customFilterList', customFilterList)
    .directive('emailBlockButton', emailBlockButton)
    .directive('emailBlockList', emailBlockList)
    .directive('filterView', filterView)
    .directive('sieveLabelInput', sieveLabelInput)
    .directive('spamListSearch', spamListSearch)
    .directive('spamLists', spamLists)
    .factory('filterModal', filterModal)
    .factory('incomingModel', incomingModel)
    .factory('spamListModel', spamListModel)
    .factory('filterAddressModal', filterAddressModal)
    .factory('sieveLint', sieveLint).name;
