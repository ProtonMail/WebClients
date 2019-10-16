import domainApi from './factories/domainApi';
import domainModel from './factories/domainModel';
import pmDomainModel from './factories/pmDomainModel';
import premiumDomainModel from './factories/premiumDomainModel';

export default angular
    .module('proton.domains', [])
    .factory('domainApi', domainApi)
    .factory('domainModel', domainModel)
    .factory('premiumDomainModel', premiumDomainModel)
    .factory('pmDomainModel', pmDomainModel).name;
