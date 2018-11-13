import createLabel from './directives/createLabel';
import dropdownFolders from './directives/dropdownFolders';
import dropdownLabels from './directives/dropdownLabels';
import labelsModel from './factories/labelsModel';
import labelModal from './modals/labelModal';
import validLabel from './directives/validLabel';
import labelColorSelector from './directives/labelColorSelector';
import labelCache from './factories/labelCache';
import manageLabels from './services/manageLabels';
import actionLabelBtn from './directives/actionLabelBtn';
import labelNameInput from './directives/labelNameInput';

export default angular
    .module('proton.labels', [])
    .directive('labelNameInput', labelNameInput)
    .directive('actionLabelBtn', actionLabelBtn)
    .factory('manageLabels', manageLabels)
    .factory('labelCache', labelCache)
    .directive('labelColorSelector', labelColorSelector)
    .directive('validLabel', validLabel)
    .directive('createLabel', createLabel)
    .directive('dropdownFolders', dropdownFolders)
    .directive('dropdownLabels', dropdownLabels)
    .factory('labelsModel', labelsModel)
    .factory('labelModal', labelModal).name;
