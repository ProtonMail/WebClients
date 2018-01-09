/* @ngInject */
function btnDownloadAttachments(attachmentDownloader) {
    const LOAD_CLASSNAME = 'btnDownloadAttachments-load';

    return {
        scope: {
            model: '='
        },
        replace: true,
        templateUrl: require('../../../templates/attachments/btnDownloadAttachments.tpl.html'),
        link(scope, el) {
            const reset = () => el[0].classList.remove(LOAD_CLASSNAME);
            const onClick = (e) => {
                // Cf Safari
                if (attachmentDownloader.isNotSupported(e)) {
                    return false;
                }

                el[0].classList.add(LOAD_CLASSNAME);
                attachmentDownloader.all(scope.model, el[0]).then(reset);
            };
            el.on('click', onClick);

            scope.$on('$destroy', () => {
                el.off('click', onClick);
            });
        }
    };
}
export default btnDownloadAttachments;
