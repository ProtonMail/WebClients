import OutsideController from './controllers/outside';
import composerOutside from './directives/composerOutside';
import attachmentModelOutside from './services/attachmentModelOutside';

export default angular
    .module('proton.outside', ['proton.routes', 'proton.constants', 'proton.utils'])
    .run((attachmentModelOutside) => attachmentModelOutside.load())
    .controller('OutsideController', OutsideController)
    .directive('composerOutside', composerOutside)
    .factory('attachmentModelOutside', attachmentModelOutside).name;
