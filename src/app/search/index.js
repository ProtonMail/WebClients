import btnAdvancedSearch from './directives/btnAdvancedSearch';
import searchContact from './directives/searchContact';
import searchForm from './directives/searchForm';
import searchModel from './factories/searchModel';
import wildcardModel from './factories/wildcardModel';
import searchValue from './services/searchValue';

export default angular
    .module('proton.search', [])
    .run((wildcardModel) => wildcardModel.init())
    .directive('btnAdvancedSearch', btnAdvancedSearch)
    .directive('searchContact', searchContact)
    .directive('searchForm', searchForm)
    .factory('searchModel', searchModel)
    .factory('wildcardModel', wildcardModel)
    .factory('searchValue', searchValue).name;
