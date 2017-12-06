import browserFixes from './services/browserFixes';
import safari from './services/safari';

export default angular
    .module('proton.browserSupport', [])
    .run((browserFixes) => browserFixes.init())
    .factory('browserFixes', browserFixes)
    .factory('safari', safari).name;
