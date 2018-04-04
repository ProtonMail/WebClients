import keysView from './directives/keysView';
import changeMailboxPassword from './factories/changeMailboxPassword';
import changePasswordModal from './factories/changePasswordModal';
import checkKeysFormat from './factories/checkKeysFormat';
import setupKeys from './factories/setupKeys';
import upgradeKeys from './factories/upgradeKeys';
import decryptUser from './services/decryptUser';

export default angular
    .module('proton.keys', [])
    .factory('decryptUser', decryptUser)
    .directive('keysView', keysView)
    .factory('changeMailboxPassword', changeMailboxPassword)
    .factory('changePasswordModal', changePasswordModal)
    .factory('checkKeysFormat', checkKeysFormat)
    .factory('setupKeys', setupKeys)
    .factory('upgradeKeys', upgradeKeys).name;
