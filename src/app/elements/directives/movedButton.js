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
        template: `
            <button class="movedButton-container">
                <div>
                    <i class="movedButton-icon fa fa-share-square-o"></i>
                    <span class="movedButton-text">${I18N.INCLUDE_MOVED_MESSAGES}</span>
                </div>
            </button>
            `,
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
