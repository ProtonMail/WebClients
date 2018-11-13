/* @ngInject */
function actionContactGroup(Contact, notification, contactGroupModel, manageContactGroup) {
    const icon = (type) => {
        if (type === 'remove.contact') {
            return '<i aria-hidden="true" class="fa fa-times"></i>';
        }
        return '';
    };

    const remove = async (scope) => {
        const { contact = {}, group = {} } = scope;
        manageContactGroup.remove(contact, group);
    };

    return {
        scope: {
            contact: '=',
            group: '='
        },
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/contact/actionContactGroup.tpl.html'),
        link(scope, el, { action }) {
            // @todo add other user-case
            // action && (el[0].textContent = I18N[action]);

            el[0].innerHTML = icon(action);
            const onClick = () => {
                scope.$applyAsync(() => {
                    action === 'remove.contact' && remove(scope);
                });
            };

            el.on('click', onClick);

            scope.$on('$destroy', () => {
                el.off('click', onClick);
            });
        }
    };
}
export default actionContactGroup;
