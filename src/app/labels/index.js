import createLabel from './directives/createLabel';
import dropdownFolders from './directives/dropdownFolders';
import dropdownLabels from './directives/dropdownLabels';
import labelsModel from './factories/labelsModel';
import labelModal from './modals/labelModal';

export default angular
    .module('proton.labels', [])
    .directive('createLabel', createLabel)
    .directive('dropdownFolders', dropdownFolders)
    .directive('dropdownLabels', dropdownLabels)
    .factory('labelsModel', labelsModel)
    .factory('labelModal', labelModal).name;
