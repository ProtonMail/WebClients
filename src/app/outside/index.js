import OutsideController from './controllers/outside';
import composerOutside from './directives/composerOutside';
import attachmentModelOutside from './services/attachmentModelOutside';

export default angular
    .module('proton.outside', ['proton.routes', 'proton.utils'])
    .controller('OutsideController', OutsideController)
    .directive('composerOutside', composerOutside)
    .factory('attachmentModelOutside', attachmentModelOutside).name;
