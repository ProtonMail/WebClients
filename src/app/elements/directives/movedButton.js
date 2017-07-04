angular.module('proton.elements')
    .directive('movedButton', ($state, gettextCatalog, tools) => {
        const showMoved = gettextCatalog.getString('Show moved messages', null, 'Link');
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
                <i class="movedButton-icon fa fa-share-square-o"></i>
                <span class="movedButton-text">${showMoved}</span>
            </button>
            `,
            link(scope, element) {
                const current = tools.filteredState();
                const onClick = () => $state.go(MAP[current].state, _.extend({}, $state.params, { page: undefined, id: undefined }));

                element.on('click', onClick);
                scope.$on('$destroy', () => element.off('click', onClick));
            }
        };
    });
