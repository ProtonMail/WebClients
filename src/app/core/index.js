angular.module('proton.core', ['proton.constants', 'proton.utils', 'proton.models'])
    .run((paginationModel) => paginationModel.init());

