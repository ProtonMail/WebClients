import addressBtnActions from './directives/addressBtnActions';
import addressKeysView from './directives/addressKeysView';
import pmMeTooltip from './directives/pmMeTooltip';
import reactivateKeysBtn from './directives/reactivateKeysBtn';
import reactivateKeys from './factories/reactivateKeys';
import addressModel from './factories/addressModel';
import addressWithoutKeys from './factories/addressWithoutKeys';
import addressKeysViewModel from './factories/addressKeysViewModel';
import addressModal from './modals/addressModal';
import addressesModal from './modals/addressesModal';
import setupAddressModal from './modals/setupAddressModal';
import selectAddressModal from './modals/selectAddressModal';
import addressWithoutKeysManager from './services/addressWithoutKeysManager';
import deleteKeyProcess from './services/deleteKeyProcess';

export default angular
    .module('proton.address', [])
    .directive('addressBtnActions', addressBtnActions)
    .directive('addressKeysView', addressKeysView)
    .directive('pmMeTooltip', pmMeTooltip)
    .directive('reactivateKeysBtn', reactivateKeysBtn)
    .factory('reactivateKeys', reactivateKeys)
    .factory('addressModel', addressModel)
    .factory('addressWithoutKeys', addressWithoutKeys)
    .factory('addressKeysViewModel', addressKeysViewModel)
    .factory('addressModal', addressModal)
    .factory('addressesModal', addressesModal)
    .factory('setupAddressModal', setupAddressModal)
    .factory('selectAddressModal', selectAddressModal)
    .factory('addressWithoutKeysManager', addressWithoutKeysManager)
    .factory('deleteKeyProcess', deleteKeyProcess).name;
