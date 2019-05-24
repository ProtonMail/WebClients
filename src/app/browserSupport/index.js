import browserFixes from './services/browserFixes';
import safari from './services/safari';
import dropIE11ModalModal from './modals/dropIE11ModalModal';

export default angular
    .module('proton.browserSupport', [])
    .factory('dropIE11ModalModal', dropIE11ModalModal)
    .run((browserFixes) => browserFixes.init())
    .factory('browserFixes', browserFixes)
    .factory('safari', safari).name;
