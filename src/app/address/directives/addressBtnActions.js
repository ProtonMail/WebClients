/* @ngInject */
function addressBtnActions(addressModel, gettextCatalog, translator) {
    const I18N = translator(() => ({
        makeDefault: gettextCatalog.getString('Make default', null, 'Action'),
        editSignature: gettextCatalog.getString('Edit signature', null, 'Action'),
        disable: gettextCatalog.getString('Disable', null, 'Action'),
        enable: gettextCatalog.getString('Enable', null, 'Action'),
        remove: gettextCatalog.getString('Delete', null, 'Action'),
        generate: gettextCatalog.getString('Generate missing keys', null, 'Action'),
        add: gettextCatalog.getString('Add address', null, 'Action')
    }));

    return {
        replace: true,
        scope: {
            model: '=?',
            model2: '=?'
        },
        template: `<button type="button" class="addressBtnActions-container">${I18N.editSignature}</button>`,
        link(scope, el, { action = 'editSignature' }) {
            action !== 'editSignature' && el.text(I18N[action]);

            const onClick = () => addressModel[action](scope.model, scope.model2);
            el.on('click', onClick);

            scope.$on('$destroy', () => {
                el.off('click', onClick);
            });
        }
    };
}
export default addressBtnActions;
