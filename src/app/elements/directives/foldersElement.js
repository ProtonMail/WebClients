angular.module('proton.elements')
.directive('foldersElement', ($rootScope, $state, gettextCatalog, $compile, mailboxIdentifersTemplate) => {
    const allowedStates = ['secured.allSent.**', 'secured.sent.**', 'secured.allDrafts.**', 'secured.drafts.**', 'secured.search.**', 'secured.starred.**', 'secured.allmail.**', 'secured.label.**'];
    const isAllowedState = () => allowedStates.some((key) => $state.includes(key));
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
        },
        folder: {
            className: 'fa-folder'
        }
    };

    const { getTemplateLabels } = mailboxIdentifersTemplate({ MAP_LABELS });

    return {
        templateUrl: 'templates/elements/foldersElement.tpl.html',
        replace: true,
        scope: {
            conversation: '='
        },
        link(scope, el) {

            const build = (event, { LabelIDs = [], Labels = [] }) => {
                if ((LabelIDs.length || Labels.length) && isAllowedState()) {
                    const labelIDs = (Labels.length) ? _.map(Labels, ({ ID }) => ID) : LabelIDs;
                    const tpl = $compile(getTemplateLabels(labelIDs))(scope);
                    el.empty().append(tpl);
                }
            };

            const unsubscribe = $rootScope.$on('foldersElement.' + scope.conversation.ID, build);

            build(undefined, scope.conversation);

            scope.$on('$destroy', unsubscribe);
        }
    };
});
