angular.module('proton.composer')
    .directive('composerDropzone', ($rootScope, attachmentFileFormat, attachmentModel, notify, gettextCatalog, CONSTANTS) => {

        Dropzone.autoDiscover = false;

        const { BASE_SIZE, ATTACHMENT_SIZE_LIMIT, ATTACHMENT_NUMBER_LIMIT } = CONSTANTS;
        const ATTACHMENT_MAX_SIZE = ATTACHMENT_SIZE_LIMIT * BASE_SIZE * BASE_SIZE;

        const dropMessages = {
            [ATTACHMENT_NUMBER_LIMIT]: `Messages are limited to ${ATTACHMENT_NUMBER_LIMIT} attachments`,
            [ATTACHMENT_SIZE_LIMIT]: `Attachments are limited to ${ATTACHMENT_SIZE_LIMIT} MB.`,
            [ATTACHMENT_MAX_SIZE](bytes) {
                const total = Math.round(10 * bytes / BASE_SIZE / BASE_SIZE) / 10;
                return `Attachments are limited to ${ATTACHMENT_SIZE_LIMIT} MB. Total attached would be: ${total} MB.`;
            }
        };

        const dictDefaultMessage = gettextCatalog.getString('Drop a file here to upload', null, 'Info');

        const notifyError = (message) => notify({ message, classes: 'notification-danger' });

        /**
         * Compute some informations to get the current context for a dropzone
         * @param  {Message} message
         * @param  {File} file
         * @return {Object}F
         */
        function getDropFileConfigMessage(message, file) {
            const messageSize = message.attachmentsSize();
            const currentSize = messageSize + (message.queuedFilesSize || 0) + file.size;
            return {
                currentSize,
                numberFiles: (message.Attachments || []).length + (message.queuedFiles || 0)
            };
        }

        /**
         * BuildQueueReducer, take message as argument and get the dropzone as
         * context.
         * @param  {Message} message
         * @return {Function}         Reducer(<queu>, <file>)
         */
        function buildQueue(message, dropzone) {
            return (queue, file) => {
                const { currentSize, numberFiles } = getDropFileConfigMessage(message, file);

                if (numberFiles === ATTACHMENT_NUMBER_LIMIT) {
                    const msg = dropMessages[ATTACHMENT_NUMBER_LIMIT];
                    dropzone.removeFile(file);
                    notifyError(msg);
                    return queue;
                }

                if (currentSize >= ATTACHMENT_MAX_SIZE) {
                    const msg = dropMessages[ATTACHMENT_MAX_SIZE](currentSize);
                    dropzone.removeFile(file);
                    notifyError(msg);
                    return queue;
                }

                if (currentSize === 0) {
                    const msg = dropMessages[ATTACHMENT_SIZE_LIMIT];
                    /* file is too big */
                    dropzone.removeFile(file);
                    notifyError(msg);
                    return queue;
                }

                queue.files.push({
                    file,
                    isEmbedded: attachmentFileFormat.isEmbedded(file.type)
                });
                queue.size += file.size;
                return queue;
            };
        }

        /**
         * Check if we can upload the queue
         * @param  {Message} message      current message
         * @param  {Array}  list         Current queue
         * @param  {Integer} options.size Current size of the queue if there already one pending
         * @return {Boolean}
         */
        const canUploadList = (message, list = [], { size = 0 } = {}) => {
            const listSize = [].slice.call(list).reduce((acc, file) => acc + file.size, 0);
            return (message.attachmentsSize() + size + listSize) <= ATTACHMENT_MAX_SIZE;
        };

        /**
         * Generate the configuration for a dropzone
         * @param  {Message} message
         * @return {Object}
         */
        const getConfig = (message, dispatchAction) => ({
            addRemoveLinks: false,
            dictDefaultMessage,
            url: '/file/post',
            autoProcessQueue: false,
            paramName: 'file', // The name that will be used to transfer the file
            previewTemplate: '<div style="display:none"></div>',
            init() {
                _.forEach(message.Attachments, ({ Name, Size, MIMEType, ID }) => {
                    const mockFile = { name: Name, size: Size, type: MIMEType, ID };
                    this.options.addedfile.call(this, mockFile);
                }, this);

                // Get list of added files
                this.on('addedfiles', (list) => {

                    if (!canUploadList(message, list, attachmentModel.getCurrentQueue(message))) {
                        this.removeAllFiles();
                        let id;

                        // Prevent freeze from the API
                        return (id = setTimeout(() => {
                            notifyError(dropMessages[ATTACHMENT_SIZE_LIMIT]);
                            dispatchAction(message, { size: 0, files: [] });
                            clearTimeout(id);
                        }, 100));
                    }

                    // Create a queue of attachments and bind the dropzone as context
                    const queue = [].slice.call(list)
                        .reduce(buildQueue(message, this), {
                            files: [],
                            size: 0
                        });
                    this.removeAllFiles();
                    queue.hasEmbedded = queue.files.some(({ isEmbedded }) => isEmbedded);
                    dispatchAction(message, queue);
                });
            }
        });

        return {
            link(scope, el, { action = '' }) {

                const key = ['attachment.upload', action].filter(Boolean).join('.');

                /**
                 * Dispatch action for the model
                 * @param  {Message} message
                 * @param  {Array}  queue
                 */
                const dispatchAction = (message, queue = []) => {
                    $rootScope.$emit(key, {
                        type: 'drop',
                        data: {
                            messageID: message.ID,
                            message, queue
                        }
                    });
                };
                const dropzone = new Dropzone(el[0], getConfig(scope.message, dispatchAction));

                // Adding a message from the toolbar
                const unsubscribe = $rootScope
                    .$on('addFile', (e, { asEmbedded, message }) => {
                        if (message.ID === scope.message.ID) {
                            scope.message.asEmbedded = asEmbedded;
                            dropzone.element.click();
                        }
                    });

                scope
                    .$on('$destroy', () => {
                        dropzone.off('dragover');
                        dropzone.off('addedfiles');
                        dropzone.destroy();
                        unsubscribe();
                    });
            }
        };
    });

