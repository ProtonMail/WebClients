import ElementsController from './controllers/elements';
import advancedFilterElement from './directives/advancedFilterElement';
import countElementsSelected from './directives/countElementsSelected';
import elementView from './directives/elementView';
import elementsContainer from './directives/elementsContainer';
import elementsSelector from './directives/elementsSelector';
import foldersElement from './directives/foldersElement';
import labelsElement from './directives/labelsElement';
import moveElement from './directives/moveElement';
import movedButton from './directives/movedButton';
import movedSelect from './directives/movedSelect';
import navElements from './directives/navElements';
import ptSelectElement from './directives/ptSelectElement';
import ptSelectElements from './directives/ptSelectElements';
import ptSelectMultipleElements from './directives/ptSelectMultipleElements';
import ptStar from './directives/ptStar';
import searchLimitReached from './directives/searchLimitReached';
import timeElement from './directives/timeElement';
import elementsError from './factories/elementsError';
import limitElementsModel from './factories/limitElementsModel';
import removeElement from './services/removeElement';
import forgeRequestParameters from './services/forgeRequestParameters';

export default angular
    .module('proton.elements', [])
    .factory('forgeRequestParameters', forgeRequestParameters)
    .controller('ElementsController', ElementsController)
    .directive('advancedFilterElement', advancedFilterElement)
    .directive('countElementsSelected', countElementsSelected)
    .directive('elementView', elementView)
    .directive('elementsContainer', elementsContainer)
    .directive('elementsSelector', elementsSelector)
    .directive('foldersElement', foldersElement)
    .directive('labelsElement', labelsElement)
    .directive('moveElement', moveElement)
    .directive('movedButton', movedButton)
    .directive('movedSelect', movedSelect)
    .directive('navElements', navElements)
    .directive('ptSelectElement', ptSelectElement)
    .directive('ptSelectElements', ptSelectElements)
    .directive('ptSelectMultipleElements', ptSelectMultipleElements)
    .directive('ptStar', ptStar)
    .directive('searchLimitReached', searchLimitReached)
    .directive('timeElement', timeElement)
    .factory('elementsError', elementsError)
    .factory('limitElementsModel', limitElementsModel)
    .factory('removeElement', removeElement).name;
