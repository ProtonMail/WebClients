import _ from 'lodash';

/* @ngInject */
function searchContact(dispatchers, $state, $stateParams, contactCache, gettextCatalog) {
    const I18N = gettextCatalog.getString('Search contacts');

    return {
        replace: true,
        restrict: 'E',
        scope: {},
        templateUrl: require('../../../templates/search/searchContact.tpl.html'),
        link(scope, element) {
            const { on, unsubscribe, dispatcher } = dispatchers(['contacts']);

            const dispatch = (keyword = '') => dispatcher.contacts('searchingContact', { keyword });

            const $input = element[0].querySelector('.searchInput');
            scope.query = $stateParams.keyword || '';

            const switchState = (isReset, keyword = null) => {
                const state = isReset ? 'secured.contacts' : $state.$current.name;

                $state.go(state, { page: 1, keyword }, { notify: isReset }).then(() => (!isReset ? dispatch(keyword) : dispatch()));
            };

            const onSubmit = () => switchState(false, scope.query);
            const onReset = () => switchState(true);
            const onInput = _.debounce(onSubmit, 300);
            const update = () => {
                const total = contactCache.total();
                const placeholder = total ? `${I18N} (${total})` : I18N;
                $input.placeholder = placeholder;
            };

            on('contacts', (event, { type }) => {
                type === 'contactsUpdated' && update();
            });

            element.on('submit', onSubmit);
            element.on('reset', onReset);
            element.on('input', onInput);
            update();

            scope.$on('$destroy', () => {
                unsubscribe();
                element.off('submit', onSubmit);
                element.off('reset', onReset);
                element.off('input', onInput);
            });
        }
    };
}
export default searchContact;
