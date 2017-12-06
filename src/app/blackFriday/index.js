import blackFridayFree from './directives/blackFridayFree';
import blackFridayPaid from './directives/blackFridayPaid';
import blackFridayPrice from './directives/blackFridayPrice';
import blackFridayModel from './factories/blackFridayModel';
import blackFridayModal from './modals/blackFridayModal';

export default angular
    .module('proton.blackFriday', [])
    .run((blackFridayModel) => blackFridayModel.init())
    .directive('blackFridayFree', blackFridayFree)
    .directive('blackFridayPaid', blackFridayPaid)
    .directive('blackFridayPrice', blackFridayPrice)
    .factory('blackFridayModel', blackFridayModel)
    .factory('blackFridayModal', blackFridayModal).name;
