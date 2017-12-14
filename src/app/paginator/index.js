import paginator from './directives/paginator';
import paginatorScope from './directives/paginatorScope';
import cachePages from './factories/cachePages';
import paginationModel from './factories/paginationModel';

angular
    .module('proton.paginator', [])
    .directive('paginator', paginator)
    .directive('paginatorScope', paginatorScope)
    .factory('cachePages', cachePages)
    .factory('paginationModel', paginationModel);

export default angular.module('proton.paginator').name;
