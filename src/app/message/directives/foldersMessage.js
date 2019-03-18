/* @ngInject */
function foldersMessage(dispatchers, gettextCatalog, $compile, mailboxIdentifersTemplate) {
    const MAP_LABELS = {
        archive: {
            className: 'fa-archive',
            tooltip: gettextCatalog.getString('In archive', null, 'Tooltip')
        },
        trash: {
            className: 'fa-trash-o',
            tooltip: gettextCatalog.getString('In trash', null, 'Tooltip')
        },
        spam: {
            className: 'fa-ban',
            tooltip: gettextCatalog.getString('In spam', null, 'Tooltip')
        },
        folder: {
            className: 'fa-folder'
        }
    };

    const MAP_TYPES = {
        drafts: {
            className: 'pm_tag',
            tooltip: gettextCatalog.getString('Draft', null, 'Label')
        },
        sent: {
            className: 'pm_tag',
            tooltip: gettextCatalog.getString('Sent', null, 'Label')
        }
    };

    const { getTemplateLabels, getTemplateType } = mailboxIdentifersTemplate({ MAP_LABELS, MAP_TYPES });

    return {
        templateUrl: require('../../../templates/message/foldersMessage.tpl.html'),
        replace: true,
        link(scope, el) {
            const { on, unsubscribe } = dispatchers();

            const build = ({ LabelIDs = [], Type }) => {
                let template = '';
                LabelIDs.length && (template += getTemplateLabels(LabelIDs));
                angular.isNumber(Type) && (template += getTemplateType(Type));

                // Compile the template to bind the tooltip etc.
                el.empty().append($compile(template)(scope));
            };

            on('foldersMessage', (event, { data: element }) => {
                if (element.ID === scope.message.ID) {
                    build(element);
                }
            });

            build(scope.message);

            scope.$on('$destroy', unsubscribe);
        }
    };
}
export default foldersMessage;
