angular.module('proton.core', ['proton.constants', 'proton.utils'])
    .run((paginationModel, cachePages) => {
        paginationModel.init();
        cachePages.init();
    });
