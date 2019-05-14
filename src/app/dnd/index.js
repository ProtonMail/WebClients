import ptdndconstants from './constants/ptdndconstants';
import ptDropzone from './directives/ptDropzone';
import ptDndModel from './factories/ptDndModel';
import ptDndNotification from './factories/ptDndNotification';
import actionDnd from './services/actionDnd';
import ptDndUtils from './services/ptDndUtils';
import ptDraggleCreator from './factories/ptDraggleCreator';
import ptDraggableElement from './directives/ptDraggableElement';
import ptDraggableContact from './directives/ptDraggableContact';

export default angular
    .module('proton.dnd', ['proton.message', 'proton.labels', 'proton.conversation'])
    .directive('ptDraggableContact', ptDraggableContact)
    .directive('ptDraggableElement', ptDraggableElement)
    .factory('ptDraggleCreator', ptDraggleCreator)
    .run((actionDnd) => actionDnd.init())
    .constant('PTDNDCONSTANTS', ptdndconstants)
    .directive('ptDropzone', ptDropzone)
    .factory('ptDndModel', ptDndModel)
    .factory('ptDndNotification', ptDndNotification)
    .factory('actionDnd', actionDnd)
    .factory('ptDndUtils', ptDndUtils).name;
