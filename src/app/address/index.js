import addressBtnActions from './directives/addressBtnActions';
import addressKeysView from './directives/addressKeysView';
import pmMeTooltip from './directives/pmMeTooltip';
import reactivateKeysBtn from './directives/reactivateKeysBtn';
import reactivateKeys from './factories/reactivateKeys';
import addressModel from './factories/addressModel';
import addressWithoutKeys from './factories/addressWithoutKeys';
import addressModal from './modals/addressModal';
import addressesModal from './modals/addressesModal';
import addressWithoutKeysManager from './services/addressWithoutKeysManager';

export default angular
    .module('proton.address', [])
    .directive('addressBtnActions', addressBtnActions)
    .directive('addressKeysView', addressKeysView)
    .directive('pmMeTooltip', pmMeTooltip)
    .directive('reactivateKeysBtn', reactivateKeysBtn)
    .factory('reactivateKeys', reactivateKeys)
    .factory('addressModel', addressModel)
    .factory('addressWithoutKeys', addressWithoutKeys)
    .factory('addressModal', addressModal)
    .factory('addressesModal', addressesModal)
    .factory('addressWithoutKeysManager', addressWithoutKeysManager).name;
