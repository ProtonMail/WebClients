import CONFIG from '../../config';

/* @ngInject */
function appCopyright(gettextCatalog) {
    const label = gettextCatalog.getString('ProtonMail.com - Made globally, hosted in Switzerland.', null, 'copyright');

    return {
        replace: true,
        template: `<span class="appCopyright-container">${CONFIG.year} ${label}</span>`
    };
}
export default appCopyright;
