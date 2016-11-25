angular.module('proton.squire')
    .factory('editorDropzone', ($rootScope, gettextCatalog, attachmentFileFormat, squireExecAction) => {

        const CLASS_DRAGGABLE = 'editorDropzone-enter';
        const CLASS_DRAGGABLE_MASK = 'editorDropzone-mask';
        const dictDefaultMessage = gettextCatalog.getString('Drop an image here to insert', null, 'Info');

        const getConfig = (message, node) => ({
            addRemoveLinks: false,
            dictDefaultMessage,
            url: '/file/post',
            acceptedFiles: 'image/*',
            autoProcessQueue: false,
            previewTemplate: '<div style="display:none"></div>',
            paramName: 'file', // The name that will be used to transfer the file
            init() {
                this.on('addedfile', (file) => {
                    squireExecAction.insertImage(message, '', file);
                    this.removeAllFiles();
                    node[0].classList.remove(CLASS_DRAGGABLE);
                    node[0].classList.add(CLASS_DRAGGABLE_MASK);
                });
            }
        });

        return (node, message, editor) => {

            const $dropzone = node[0].querySelector('.squire-dropzone');
            const dropzone = new Dropzone($dropzone, getConfig(message, node));

            const addClass = (className) => node[0].classList.add(className);
            const removeClass = (className) => node[0].classList.remove(className);

            /**
             * We need to set a mask above
             */
            addClass(CLASS_DRAGGABLE_MASK);

            /**
             * Add the mask over the body when we lost the focus on the editor
             */
            const onBlur = () => addClass(CLASS_DRAGGABLE_MASK);

            /**
             * Hide the dropzone after the last dragover event
             * Dragleave event is inconsistant.
             */
            const onDragOver = _.debounce(() => removeClass(CLASS_DRAGGABLE), 500);

            const onClick = () => {
                removeClass(CLASS_DRAGGABLE_MASK);
                editor.focus();
            };

            /**
             * Display dropzone to the user
             */
            const onDragEnter = (e) => {
                removeClass(CLASS_DRAGGABLE_MASK);
                attachmentFileFormat.isUploadAbleType(e) && addClass(CLASS_DRAGGABLE);
            };

            node.on('click', onClick);
            editor.addEventListener('blur', onBlur);
            node[0].addEventListener('dragenter', onDragEnter);
            $dropzone.addEventListener('dragover', onDragOver);

            return () => {
                node.off('click', onClick);
                editor.removeEventListener('blur', onBlur);
                node[0].removeEventListener('dragenter', onDragEnter);
                $dropzone.removeEventListener('dragover', onDragOver);
                dropzone.off('addedfile');
                dropzone.destroy();
            };
        };
    });
