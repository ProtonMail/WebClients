import _ from 'lodash';

/* @ngInject */
function importCardDropzone(dispatchers, notification, gettextCatalog) {
    const { dispatcher } = dispatchers(['importCardDropzone']);
    const I18N = {
        dictDefaultMessage: gettextCatalog.getString('Drop file or click here', null, 'Info'),
        dictInvalidFileType: gettextCatalog.getString('Invalid file type', null, 'Error')
    };

    const CLASS_HAS_FILE = 'importCardDropzone-has-file';

    return {
        scope: {},
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/contact/importCardDropzone.tpl.html'),
        link(scope, el) {
            const dropzone = new Dropzone(el[0].firstElementChild, {
                addRemoveLinks: false,
                dictDefaultMessage: I18N.dictDefaultMessage,
                dictInvalidFileType: I18N.dictInvalidFileType,
                url: '/file/post',
                autoProcessQueue: false,
                maxFiles: 1,
                paramName: 'file', // The name that will be used to transfer the file
                previewTemplate: '<div style="display:none"></div>',
                ignoreHiddenFiles: true,
                acceptedFiles: '.vcf,.csv'
            });

            dropzone.on('addedfiles', (list) => {
                const file = list[0];
                if (!/\.(vcf|csv)$/i.test(file.name)) {
                    _.defer(() => dropzone.removeAllFiles(true), 100);
                    return notification.error(I18N.dictInvalidFileType);
                }

                dispatcher.importCardDropzone('import', [file]);
                scope.$applyAsync(() => {
                    el[0].classList.add(CLASS_HAS_FILE);
                    scope.fileDropped = file.name;
                });
            });

            scope.$on('$destroy', () => {
                dropzone.off('dragover');
                dropzone.off('addedfiles');
                dropzone.destroy();
            });
        }
    };
}
export default importCardDropzone;
