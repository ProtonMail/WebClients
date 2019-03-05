/* @ngInject */
const composerAttachmentsSize = ($filter, dispatchers) => ({
    replace: true,
    templateUrl: require('../../../templates/directives/composer/composerAttachmentsSize.tpl.html'),
    link(scope, el) {
        const humanSize = $filter('humanSize');
        const { on, unsubscribe } = dispatchers();
        let attachmentsSize = 0;

        const updateTotalSize = (size) => {
            el[0].textContent = humanSize(size);
        };

        on('attachment.upload', (e, { type, data }) => {
            if (type === 'uploaded.success') {
                attachmentsSize += data.packet.Size;
                updateTotalSize(attachmentsSize);
            }
            if (['remove.success', 'upload.success'].includes(type)) {
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
