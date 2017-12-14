import changeMailboxPassword from './factories/changeMailboxPassword';
import changePasswordModal from './factories/changePasswordModal';
import checkKeysFormat from './factories/checkKeysFormat';
import keyPasswordModal from './factories/keyPasswordModal';
import setupKeys from './factories/setupKeys';
import upgradeKeys from './factories/upgradeKeys';

export default angular
    .module('proton.keys', [])
    .factory('changeMailboxPassword', changeMailboxPassword)
    .factory('changePasswordModal', changePasswordModal)
    .factory('checkKeysFormat', checkKeysFormat)
    .factory('keyPasswordModal', keyPasswordModal)
    .factory('setupKeys', setupKeys)
    .factory('upgradeKeys', upgradeKeys).name;
