import addressBtnActions from './directives/addressBtnActions';
import addressKeysView from './directives/addressKeysView';
import addressModel from './factories/addressModel';
import addressWithoutKeys from './factories/addressWithoutKeys';
import addressModal from './modals/addressModal';
import addressesModal from './modals/addressesModal';
import addressWithoutKeysManager from './services/addressWithoutKeysManager';

export default angular
    .module('proton.address', [])
    .directive('addressBtnActions', addressBtnActions)
    .directive('addressKeysView', addressKeysView)
    .factory('addressModel', addressModel)
    .factory('addressWithoutKeys', addressWithoutKeys)
    .factory('addressModal', addressModal)
    .factory('addressesModal', addressesModal)
    .factory('addressWithoutKeysManager', addressWithoutKeysManager).name;
