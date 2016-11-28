angular.module('proton.ui')
    .directive('progressUpload', ($rootScope, CONSTANTS) => {

        const { UPLOAD_GRADIENT_DARK, UPLOAD_GRADIENT_LIGHT } = CONSTANTS;

        /**
         * Compute the gradient
         * @param  {Number} progress
         * @return {String}          CSS gradient declaration
         */
        const getProgressStyle = (progress = 0) => {
            return `linear-gradient(90deg, rgba(${UPLOAD_GRADIENT_DARK}, 1) ${progress}%, rgba(${UPLOAD_GRADIENT_LIGHT}, 1) 0%)`;
        };

        const toggleBtn = (close, remove) => {
            remove.classList.remove('hidden');
            close.classList.add('hidden');
        };

        /**
         * Check if this is the current attachment for the current message
         * @param  {Object} { id, messageID }) From the scope.model
         * @return {Function}       A function taking the data from the subscriber
         */
        const isAttachementOfMessage = ({ id, messageID }) => (data) => {
            return (data.messageID === messageID) && (data.id === id);
        };

        return {
            scope: {
                model: '='
            },
            replace: true,
            templateUrl: 'templates/directives/ui/progressBar.tpl.html',
            link(scope, el) {

                const $btnClose = el[0].querySelector('.progressLoader-btn-close');
                const $btnRemove = el[0].querySelector('.progressLoader-btn-remove');
                const isValidAttachment = isAttachementOfMessage(scope.model);


                /**
                 * If you do a reply it can contain attachment,
                 * we need to be able to remove them.
                 * When you add a new one the key uploading will be true.
                 * Also no need to susbcribe to the event.
                 */
                if (!scope.model.packet.uploading) {
                    return toggleBtn($btnClose, $btnRemove);
                }

                // UX response, the user can see it's uploading even with a slow co
                el[0].style.background = getProgressStyle(1);

                const unsubscribe = $rootScope
                    .$on('attachment.upload', (e, { type, data = {} }) => {

                        // Can upload many attachments at the same time do something only for the current one
                        if (!isValidAttachment(data)) {
                            return;
                        }

                        if (type === 'uploading') {
                            // On end display remove button and remove the subscribe as we cannot reupload it
                            if (data.progress === 100) {
                                el[0].classList.remove('uploading');
                                el[0].style.background = '';
                                toggleBtn($btnClose, $btnRemove, data.status);
                                unsubscribe();
                            }

                            if (data.progress && data.progress < 100) {
                                el[0].style.background = getProgressStyle(data.progress);
                            }
                        }

                    });

                scope.$on('$destroy', () => unsubscribe());
            }
        };
    });
