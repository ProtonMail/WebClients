import domainsMenuStep from './directives/domainsMenuStep';
import domainApi from './factories/domainApi';
import domainModel from './factories/domainModel';
import pmDomainModel from './factories/pmDomainModel';
import premiumDomainModel from './factories/premiumDomainModel';
import dkimModal from './modals/dkimModal';
import dmarcModal from './modals/dmarcModal';
import domainModal from './modals/domainModal';
import mxModal from './modals/mxModal';
import spfModal from './modals/spfModal';

export default angular
    .module('proton.domains', [])
    .directive('domainsMenuStep', domainsMenuStep)
    .factory('domainApi', domainApi)
    .factory('domainModel', domainModel)
    .factory('premiumDomainModel', premiumDomainModel)
    .factory('dkimModal', dkimModal)
    .factory('dmarcModal', dmarcModal)
    .factory('domainModal', domainModal)
    .factory('mxModal', mxModal)
    .factory('spfModal', spfModal)
    .factory('pmDomainModel', pmDomainModel).name;
