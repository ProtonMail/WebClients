angular.module('proton.commons')
    .directive('appCopyright', (CONFIG, gettextCatalog) => {
        const label = gettextCatalog.getString('ProtonMail.com - Made globally, hosted in Switzerland.', null, 'copyright');

        return {
            replace: true,
            template: '<span class="appCopyright-container"></span>',
            compile(el) {
                el.text(`${CONFIG.year} ${label}`);
            }
        };
    });
