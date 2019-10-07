import { API_CUSTOM_ERROR_CODES } from '../../errors';

/* @ngInject */
function noResults(elementsError, gettextCatalog, dispatchers, translator) {
    const I18N = translator(() => ({
        LEARN_MORE: gettextCatalog.getString('Learn more', null, 'Link')
    }));

    return {
        restrict: 'E',
        replace: true,
        templateUrl: require('../../../templates/directives/ui/noResults.tpl.html'),
        link(scope, el) {
            const { dispatcher } = dispatchers(['search']);
            const { code, error } = elementsError.last();

            scope.resetSearch = () => {
                dispatcher.search('reset.search');
                window.history.back();
            };

            if (code === API_CUSTOM_ERROR_CODES.MESSAGE_SEARCH_QUERY_SYNTAX) {
                const $error = el[0].querySelector('.messagePlaceholder-error');
                $error.removeAttribute('hidden');
                $error.innerHTML = `${error}.<br /><a href="https://protonmail.com/support/knowledge-base/search/" target="_blank">${I18N.LEARN_MORE}</a>`;
            }
        }
    };
}
export default noResults;
