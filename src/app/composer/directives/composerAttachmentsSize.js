/* @ngInject */
const composerAttachmentsSize = ($rootScope, $filter) => ({
    replace: true,
    templateUrl: require('../../../templates/directives/composer/composerAttachmentsSize.tpl.html'),
    link(scope, el) {
        const humanSize = $filter('humanSize');
        let attachmentsSize = 0;

        const updateTotalSize = (size) => {
            el[0].textContent = humanSize(size);
        };

        const unsubscribe = $rootScope.$on('attachment.upload', (e, { type, data }) => {
            if (type === 'uploaded.success') {
                attachmentsSize += data.packet.Size;
                updateTotalSize(attachmentsSize);
            }
            if (type === 'upload.success') {
                attachmentsSize = scope.message.attachmentsSize();
                updateTotalSize(attachmentsSize);
            }
        });

        scope.$on('$destroy', () => {
            unsubscribe();
        });
    }
});
export default composerAttachmentsSize;
