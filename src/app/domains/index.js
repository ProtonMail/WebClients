import domainsMenuStep from './directives/domainsMenuStep';
import domainApi from './factories/domainApi';
import domainModel from './factories/domainModel';
import pmDomainModel from './factories/pmDomainModel';

export default angular
    .module('proton.domains', [])
    .directive('domainsMenuStep', domainsMenuStep)
    .factory('domainApi', domainApi)
    .factory('domainModel', domainModel)
    .factory('pmDomainModel', pmDomainModel).name;
