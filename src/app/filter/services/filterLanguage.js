angular.module('proton.autoresponder')
    .factory('filterLanguage', (gettextCatalog) => {


        const BLOCK_FILTER_ADDED = gettextCatalog.getString('Spam Filter Added');

        const BLOCK_FILTER_UPDATED = gettextCatalog.getString('Spam Filter Updated', null, 'Incoming Defaults');

        return { BLOCK_FILTER_ADDED, BLOCK_FILTER_UPDATED };
    });
