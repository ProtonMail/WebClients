import OutsideController from './controllers/outside';
import OutsideUnlockController from './controllers/outsideUnlock';
import composerOutside from './directives/composerOutside';
import attachmentModelOutside from './services/attachmentModelOutside';

export default angular
    .module('proton.outside', ['proton.routes', 'proton.utils'])
    .controller('OutsideController', OutsideController)
    .controller('OutsideUnlockController', OutsideUnlockController)
    .directive('composerOutside', composerOutside)
    .factory('attachmentModelOutside', attachmentModelOutside).name;
