/* @ngInject */
function progressUpload(dispatchers, CONSTANTS) {
    const { UPLOAD_GRADIENT_DARK, UPLOAD_GRADIENT_LIGHT } = CONSTANTS;
    const CLASS_UPLOADED = 'progressUpload-uploaded';
    const CLASS_UPLOADING = 'progressUpload-uploading';

    /**
     * Compute the gradient
     * @param  {Number} progress
     * @return {String}          CSS gradient declaration
     */
    const getProgressStyle = (progress = 0) => {
        return `linear-gradient(90deg, rgba(${UPLOAD_GRADIENT_DARK}, 1) ${progress}%, rgba(${UPLOAD_GRADIENT_LIGHT}, 1) 0%)`;
    };

    /**
     * Check if this is the current attachment for the current message
     * @param  {Object} { id, messageID }) From the scope.model
     * @return {Function}       A function taking the data from the subscriber
     */
    const isAttachementOfMessage = ({ id, messageID }) => ({
        isAttachment(data) {
            return data.messageID === messageID && data.id === id;
        },
        isMessage(data) {
            return data.messageID === messageID;
        }
    });

    return {
        scope: {
            model: '='
        },
        replace: true,
        templateUrl: require('../../../templates/directives/ui/progressUpload.tpl.html'),
        link(scope, el) {
            const { on, unsubscribe } = dispatchers();

            const tester = isAttachementOfMessage(scope.model);

            /**
             * If you do a reply it can contain attachment,
             * we need to be able to remove them.
             * When you add a new one the key uploading will be true.
             * Also no need to subscribe to the event.
             */
            if (!scope.model.packet.uploading) {
                el[0].classList.remove(CLASS_UPLOADING);
                return el[0].classList.add(CLASS_UPLOADED);
            }

            // UX response, the user can see it's uploading even with a slow co
            el[0].style.background = getProgressStyle(1);

            on('attachment.upload', (e, { type, data = {} }) => {
                if (!tester.isMessage(data) || !tester.isAttachment(data)) {
                    return;
                }

                if (type === 'uploaded.success') {
                    el[0].classList.add(CLASS_UPLOADED);
                    return unsubscribe();
                }

                if (type === 'uploading') {
                    // On end display remove button and remove the subscribe as we cannot reupload it
                    if (data.progress === 100) {
                        return _rAF(() => {
                            el[0].classList.remove(CLASS_UPLOADING);
                            el[0].style.background = '';
                        });
                    }

                    if (data.progress && data.progress < 100) {
                        el[0].style.background = getProgressStyle(data.progress);
                    }
                }
            });

            scope.$on('$destroy', unsubscribe);
        }
    };
}
export default progressUpload;
