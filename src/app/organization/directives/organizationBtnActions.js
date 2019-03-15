/* @ngInject */
function organizationBtnActions(organizationModel, organizationKeysModel, gettextCatalog, translator) {
    const I18N = translator(() => ({
        changePassword: gettextCatalog.getString('Change organization password', null, 'Action'),
        changeKeys: gettextCatalog.getString('Change organization keys', null, 'Action'),
        resetKeys: gettextCatalog.getString('Reset Keys', null, 'Action'),
        activateKeys: gettextCatalog.getString('Activate Keys', null, 'Action'),
        restoreKeys: gettextCatalog.getString('Restore Keys', null, 'Action')
    }));

    const getKey = (action) => {
        const key = action === 'restoreKeys' ? 'activateKeys' : action;
        return key === 'resetKeys' ? 'changeKeys' : key;
    };

    return {
        replace: true,
        template: `<button type="button" class="organizationActions-container">${I18N.changePassword}</button>`,
        link(scope, el, { action = 'changePassword' }) {
            const key = getKey(action);
            action !== 'changePassword' && el.text(I18N[action]);

            const onClick = () => {
                if (key === 'activateKeys') {
                    return organizationKeysModel[key](organizationModel.get());
                }

                organizationModel[key]();
            };
            el.on('click', onClick);

            scope.$on('$destroy', () => {
                el.off('click', onClick);
            });
        }
    };
}
export default organizationBtnActions;
