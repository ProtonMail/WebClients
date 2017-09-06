angular.module('proton.filter')
    .directive('spamListSearch', (spamListModel) => {

        const DEBOUNCE_TIME = 500;

        const onEvent = (element, type, callback) => {
            element.addEventListener(type, callback);
            return () => element.removeEventListener(type, callback);
        };

        return {
            replace: true,
            restrict: 'E',
            templateUrl: 'templates/filter/spamListSearch.tpl.html',
            scope: {},
            link(scope, elem) {

                const input = elem[0].querySelector('input');

                const unsubscribe = [];

                const lists = spamListModel.getLists();

                const onInput = () => _.each(lists, (list) => list.search(input.value.trim() || null));

                unsubscribe.push(onEvent(input, 'input', _.debounce(onInput, DEBOUNCE_TIME)));

                scope.$on('$destroy', () => {
                    _.each(unsubscribe, (cb) => cb());
                    unsubscribe.length = 0;
                });
            }
        };
    });
