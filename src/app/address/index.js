import addressModel from './factories/addressModel';
import addressWithoutKeys from './factories/addressWithoutKeys';
import addressModal from './modals/addressModal';
import setupAddressModal from './modals/setupAddressModal';
import selectAddressModal from './modals/selectAddressModal';
import addressWithoutKeysManager from './services/addressWithoutKeysManager';
import deleteKeyProcess from './services/deleteKeyProcess';

export default angular
    .module('proton.address', [])
    .factory('addressModel', addressModel)
    .factory('addressWithoutKeys', addressWithoutKeys)
    .factory('addressModal', addressModal)
    .factory('setupAddressModal', setupAddressModal)
    .factory('selectAddressModal', selectAddressModal)
    .factory('addressWithoutKeysManager', addressWithoutKeysManager)
    .factory('deleteKeyProcess', deleteKeyProcess).name;
