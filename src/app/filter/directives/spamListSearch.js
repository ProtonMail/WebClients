import _ from 'lodash';

/* @ngInject */
function spamListSearch(spamListModel) {
    const DEBOUNCE_TIME = 500;

    return {
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/filter/spamListSearch.tpl.html'),
        scope: {},
        link(scope, el) {
            const $input = el.find('input');

            const onInput = _.debounce(({ target }) => {
                spamListModel.search(target.value.trim());
            }, DEBOUNCE_TIME);

            $input.on('input', onInput);

            scope.$on('$destroy', () => {
                $input.off('input', onInput);
            });
        }
    };
}
export default spamListSearch;
