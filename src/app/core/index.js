angular.module('proton.core', ['proton.constants', 'proton.utils'])
    .run((paginationModel) => paginationModel.init())
    .run((cachePages) => cachePages.init());
