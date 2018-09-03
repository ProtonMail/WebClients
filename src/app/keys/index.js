import keysView from './directives/keysView';
import changeMailboxPassword from './factories/changeMailboxPassword';
import changePasswordModal from './factories/changePasswordModal';
import checkKeysFormat from './factories/checkKeysFormat';
import exportKeyModal from './factories/exportKeyModal';
import decryptImportKeyModal from './factories/decryptImportKeyModal';
import importPrivateKey from './factories/importPrivateKey';
import keyCompression from './factories/keyCompression';
import reactivateKeyModal from './factories/reactivateKeyModal';
import exportPrivateKeyModal from './factories/exportPrivateKeyModal';
import setupKeys from './factories/setupKeys';
import upgradeKeys from './factories/upgradeKeys';
import keyInfo from './factories/keyInfo';
import formatKey from './factories/formatKey';
import formatKeys from './factories/formatKeys';
import decryptUser from './services/decryptUser';

export default angular
    .module('proton.keys', [])
    .factory('decryptUser', decryptUser)
    .directive('keysView', keysView)
    .factory('changeMailboxPassword', changeMailboxPassword)
    .factory('changePasswordModal', changePasswordModal)
    .factory('checkKeysFormat', checkKeysFormat)
    .factory('importPrivateKey', importPrivateKey)
    .factory('keyCompression', keyCompression)
    .factory('reactivateKeyModal', reactivateKeyModal)
    .factory('decryptImportKeyModal', decryptImportKeyModal)
    .factory('exportKeyModal', exportKeyModal)
    .factory('exportPrivateKeyModal', exportPrivateKeyModal)
    .factory('setupKeys', setupKeys)
    .factory('keyInfo', keyInfo)
    .factory('formatKey', formatKey)
    .factory('formatKeys', formatKeys)
    .factory('upgradeKeys', upgradeKeys).name;
