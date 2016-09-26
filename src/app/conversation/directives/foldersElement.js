angular.module('proton.conversation')
.directive('foldersElement', ($rootScope, $state, CONSTANTS, gettextCatalog, $compile, mailboxIdentifersTemplate) => {
    const allowedStates = ['secured.sent.**', 'secured.drafts.**', 'secured.search.**', 'secured.starred.**', 'secured.label.**'];
    const isAllowedState = () => allowedStates.some($state.includes);
    const MAP_LABELS = {
        inbox: {
            className: 'fa-inbox',
            tooltip: gettextCatalog.getString('In inbox', null)
        },
        sent: {
            className: 'fa-send',
            tooltip: gettextCatalog.getString('In sent', null)
        },
        drafts: {
            className: 'fa-file-text-o',
            tooltip: gettextCatalog.getString('In drafts', null)
        },
        archive: {
            className: 'fa-archive',
            tooltip: gettextCatalog.getString('In archive', null)
        },
        trash: {
            className: 'fa-trash-o',
            tooltip: gettextCatalog.getString('In trash', null)
        },
        spam: {
            className: 'fa-ban',
            tooltip: gettextCatalog.getString('In spam', null)
        }
    };

    const { getTemplateLabels } = mailboxIdentifersTemplate({ MAP_LABELS });

    return {
        templateUrl: 'templates/directives/conversation/folders.tpl.html',
        replace: true,
        scope: {
            conversation: '='
        },
        link(scope, el) {

            const build = (event, { LabelIDs }) => {
                if (Array.isArray(LabelIDs) && isAllowedState()) {
                    const tpl = $compile(getTemplateLabels(LabelIDs))(scope);
                    el.empty().append(tpl);
                }
            };

            const unsubscribe = $rootScope.$on('foldersElement.' + scope.conversation.ID, build);

            build(undefined, scope.conversation);

            scope.$on('$destroy', unsubscribe);
        }
    };
});
