angular.module('proton.ui')
.directive('numberElementSelected', (gettextCatalog, tools) => {
    return {
        scope: { number: '=' },
        replace: true,
        template: '<h2 ng-bind="text()" class="numberElementSelected-title"></h2>',
        link(scope) {
            scope.text = () => {
                const { number } = scope;
                const type = tools.typeList();
                const element = (type === 'conversation') ? gettextCatalog.getPlural(number, 'conversation selected', 'conversations selected') : gettextCatalog.getPlural(number, 'message selected', 'messages selected');
                return `${number} ${element}`;
            };
        }
    };
});
