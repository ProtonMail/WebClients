import _ from 'lodash';

/* @ngInject */
function movedButton($state, gettextCatalog, tools, translator) {
    const ACTIVE_CLASS = 'active';

    const I18N = translator(() => ({
        INCLUDE_MOVED_MESSAGES: gettextCatalog.getString('Include moved messages', null, 'Link')
    }));

    const MAP = {
        sent: 'secured.allSent',
        allSent: 'secured.sent',
        drafts: 'secured.allDrafts',
        allDrafts: 'secured.drafts'
    };

    return {
        restrict: 'E',
        replace: true,
        scope: {},
        template: `<button class="movedButton-container">
            <icon class="movedButton-icon ml0-5" fill="currentColor" name="add"></icon>
            <span class="movedButton-text">${I18N.INCLUDE_MOVED_MESSAGES}</span>
        </button>`,
        link(scope, element) {
            const current = tools.filteredState();
            const onClick = () =>
                $state.go(MAP[current], _.extend({}, $state.params, { page: undefined, id: undefined }));

            if (current === 'allSent' || current === 'allDrafts') {
                element.addClass(ACTIVE_CLASS);
            }

            element.on('click', onClick);
            scope.$on('$destroy', () => element.off('click', onClick));
        }
    };
}
export default movedButton;
