import organizationKeysModel from './factories/organizationKeysModel';
import organizationModel from './factories/organizationModel';
import subscriptionModel from './factories/subscriptionModel';
import activateOrganizationModal from './modals/activateOrganizationModal';
import changeOrganizationPasswordModal from './modals/changeOrganizationPasswordModal';
import generateOrganizationModal from './modals/generateOrganizationModal';
import setupOrganizationModal from './modals/setupOrganizationModal';
import activateOrganizationKeys from './services/activateOrganizationKeys';
import changeOrganizationPassword from './services/changeOrganizationPassword';
import organizationApi from './services/organizationApi';

export default angular
    .module('proton.organization', [])
    .factory('organizationKeysModel', organizationKeysModel)
    .factory('organizationModel', organizationModel)
    .factory('subscriptionModel', subscriptionModel)
    .factory('activateOrganizationModal', activateOrganizationModal)
    .factory('changeOrganizationPasswordModal', changeOrganizationPasswordModal)
    .factory('generateOrganizationModal', generateOrganizationModal)
    .factory('setupOrganizationModal', setupOrganizationModal)
    .factory('activateOrganizationKeys', activateOrganizationKeys)
    .factory('changeOrganizationPassword', changeOrganizationPassword)
    .factory('organizationApi', organizationApi).name;
