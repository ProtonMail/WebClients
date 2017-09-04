angular.module('proton.filter')
    .directive('spamBlackList', (gettextCatalog) => {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: 'templates/filter/spamBlackList.tpl.html',
            scope: {},
            compile(elem) {
                elem.find('email-block-list').data('filter-name', gettextCatalog.getString('Blacklist', null, 'Info'));
            }
        };
    });
