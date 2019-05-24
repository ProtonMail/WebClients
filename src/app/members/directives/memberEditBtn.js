/* @ngInject */
function memberEditBtn(memberActions, gettextCatalog, translator) {
    const I18N = translator(() => ({
        edit: gettextCatalog.getString('Edit', null, 'Action'),
        add: gettextCatalog.getString('Add user', null, 'Action'),
        destroy: gettextCatalog.getString('Delete', null, 'Action'),
        remove: gettextCatalog.getString('Remove', null, 'Action'),
        login: gettextCatalog.getString('Login', null, 'Action'),
        makeAdmin: gettextCatalog.getString('Make Admin', null, 'Action'),
        revokeAdmin: gettextCatalog.getString('Revoke Admin', null, 'Action'),
        makePrivate: gettextCatalog.getString('Make Private', null, 'Action'),
        enableSupport: gettextCatalog.getString('Enable multi-user support', null, 'Action'),
        revokeSessions: gettextCatalog.getString('Revoke sessions', null, 'Action')
    }));

    return {
        replace: true,
        scope: {
            model: '=?'
        },
        template: `<button type="button" class="memberEditBtn-container">${I18N.edit}</button>`,
        link(scope, el, { action = 'edit' }) {
            action !== 'edit' && el.text(I18N[action]);
            const onClick = () => memberActions[action](scope.model);
            el.on('click', onClick);

            scope.$on('$destroy', () => {
                el.off('click', onClick);
            });
        }
    };
}
export default memberEditBtn;
