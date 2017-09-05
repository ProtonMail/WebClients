angular.module('proton.filter')
    .directive('spamLists', (CONSTANTS, gettextCatalog) => {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: 'templates/filter/spamLists.tpl.html',
            scope: {},
            compile(elem) {
                const whitelist = elem[0].querySelector('#whitelist');
                whitelist.dataset.filterName = gettextCatalog.getString('Whitelist', null, 'Info');

                const blacklist = elem[0].querySelector('#blacklist');
                blacklist.dataset.filterName = gettextCatalog.getString('Blacklist', null, 'Info');
            }
        };
    });
