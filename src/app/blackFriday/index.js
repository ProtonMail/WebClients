import blackFridayHandler from './factories/blackFridayHandler';
import blackFridayModel from './factories/blackFridayModel';

export default angular
    .module('proton.blackFriday', [])
    .factory('blackFridayModel', blackFridayModel)
    .factory('blackFridayHandler', blackFridayHandler).name;
