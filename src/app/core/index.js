angular.module('proton.core', ['proton.constants', 'proton.utils'])
    .run((paginationModel, cachePages, backState) => {
        paginationModel.init();
        cachePages.init();
        backState.init();
    });
