import ptdndconstants from './constants/ptdndconstants';
import ptDraggable from './directives/ptDraggable';
import ptDropzone from './directives/ptDropzone';
import ptDndModel from './factories/ptDndModel';
import ptDndNotification from './factories/ptDndNotification';
import actionDnd from './services/actionDnd';
import ptDndUtils from './services/ptDndUtils';

export default angular
    .module('proton.dnd', ['proton.message', 'proton.labels', 'proton.conversation'])
    .run((actionDnd) => actionDnd.init())
    .constant('PTDNDCONSTANTS', ptdndconstants)
    .directive('ptDraggable', ptDraggable)
    .directive('ptDropzone', ptDropzone)
    .factory('ptDndModel', ptDndModel)
    .factory('ptDndNotification', ptDndNotification)
    .factory('actionDnd', actionDnd)
    .factory('ptDndUtils', ptDndUtils).name;
