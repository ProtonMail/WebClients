angular.module('proton.filter')
    .directive('spamWhiteList', (gettextCatalog) => {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: 'templates/filter/spamWhiteList.tpl.html',
            scope: {},
            compile(elem) {
                elem.find('email-block-list').data('filter-name', gettextCatalog.getString('Blacklist', null, 'Info'));
            }
        };
    });
