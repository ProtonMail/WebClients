angular.module('proton.filter')
    .directive('emailBlockList', () => {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: 'templates/filter/emailBlockList.tpl.html',
            scope: {},
            compile(elem, attr) {
                elem.find('.email-block-list-name').text(attr.filterName);
            }
        };
    });
