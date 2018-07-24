/* @ngInject */
function numberElementSelected(gettextCatalog, tools, $state) {
    return {
        scope: { number: '=' },
        replace: true,
        template: '<h2 ng-bind="text()" class="numberElementSelected-title"></h2>',
        link(scope) {
            scope.text = () => {
                const { number } = scope;
                const type = tools.getTypeList();

                if ($state.includes('secured.contacts')) {
                    return gettextCatalog.getPlural(
                        number,
                        '{{$count}} contact selected',
                        '{{$count}} contacts selected',
                        {},
                        'Info'
                    );
                }

                if (type === 'conversation') {
                    return gettextCatalog.getPlural(
                        number,
                        '{{$count}} conversation selected',
                        '{{$count}} conversations selected',
                        {},
                        'Info'
                    );
                }

                return gettextCatalog.getPlural(
                    number,
                    '{{$count}} message selected',
                    '{{$count}} messages selected',
                    {},
                    'Info'
                );
            };
        }
    };
}
export default numberElementSelected;
