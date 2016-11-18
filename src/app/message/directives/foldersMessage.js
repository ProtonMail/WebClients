angular.module('proton.message')
.directive('foldersMessage', ($rootScope, gettextCatalog, $compile, mailboxIdentifersTemplate) => {

    const MAP_LABELS = {
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

    const MAP_TYPES = {
        drafts: {
            className: 'pm_tag',
            tooltip: gettextCatalog.getString('Draft', null)
        },
        sent: {
            className: 'pm_tag',
            tooltip: gettextCatalog.getString('Sent', null)
        }
    };

    const { getTemplateLabels, getTemplateType } = mailboxIdentifersTemplate({ MAP_LABELS, MAP_TYPES });

    return {
        templateUrl: 'templates/message/foldersMessage.tpl.html',
        replace: true,
        link(scope, el) {

            const build = (event, { LabelIDs, Type }) => {
                let template = '';
                Array.isArray(LabelIDs) && (template += getTemplateLabels(LabelIDs));
                angular.isNumber(Type) && (template += getTemplateType(Type));

                // Compile the template to bind the tooltip etc.
                el.empty().append($compile(template)(scope));
            };

            const unsubscribe = $rootScope.$on('foldersMessage.' + scope.message.ID, build);

            build(undefined, scope.message);

            scope.$on('$destroy', unsubscribe);
        }
    };
});
