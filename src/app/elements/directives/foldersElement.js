import _ from 'lodash';

/* @ngInject */
function foldersElement($state, dispatchers, gettextCatalog, $compile, mailboxIdentifersTemplate) {
    const allowedStates = [
        'secured.allSent.**',
        'secured.sent.**',
        'secured.allDrafts.**',
        'secured.drafts.**',
        'secured.search.**',
        'secured.starred.**',
        'secured.allmail.**',
        'secured.label.**'
    ];
    const isAllowedState = () => allowedStates.some((key) => $state.includes(key));
    const MAP_LABELS = {
        inbox: {
            className: 'fa-inbox',
            tooltip: gettextCatalog.getString('In inbox', null, 'Type of label for a message/conversation')
        },
        sent: {
            className: 'fa-send',
            tooltip: gettextCatalog.getString('In sent', null, 'Type of label for a message/conversation')
        },
        drafts: {
            className: 'fa-file-text-o',
            tooltip: gettextCatalog.getString('In drafts', null, 'Type of label for a message/conversation')
        },
        archive: {
            className: 'fa-archive',
            tooltip: gettextCatalog.getString('In archive', null, 'Type of label for a message/conversation')
        },
        trash: {
            className: 'fa-trash-o',
            tooltip: gettextCatalog.getString('In trash', null, 'Type of label for a message/conversation')
        },
        spam: {
            className: 'fa-ban',
            tooltip: gettextCatalog.getString('In spam', null, 'Type of label for a message/conversation')
        },
        folder: {
            className: 'fa-folder'
        }
    };

    const { getTemplateLabels } = mailboxIdentifersTemplate({ MAP_LABELS });

    return {
        templateUrl: require('../../../templates/elements/foldersElement.tpl.html'),
        replace: true,
        scope: {
            conversation: '='
        },
        link(scope, el) {
            const { on, unsubscribe } = dispatchers();
            const build = (event, { LabelIDs = [], Labels = [] }) => {
                if ((LabelIDs.length || Labels.length) && isAllowedState()) {
                    const labelIDs = Labels.length ? _.map(Labels, ({ ID }) => ID) : LabelIDs;
                    const tpl = $compile(getTemplateLabels(labelIDs))(scope);
                    el.empty().append(tpl);
                }
            };

            on('foldersElement.' + scope.conversation.ID, build);

            build(undefined, scope.conversation);

            scope.$on('$destroy', unsubscribe);
        }
    };
}
export default foldersElement;
