import { DEFAULT_SQUIRE_VALUE } from '../../constants';
import { stripLinkPrefix, linkToType, formatLink } from '../../../helpers/urlHelpers';

const LINK_DEFAULT = DEFAULT_SQUIRE_VALUE.LINK;

/* @ngInject */
function squireModalListener(editorModel, editorState, squireExecAction, addLinkModal, addFileModal, dispatchers) {
    /**
     * Get the current selection from the editor.
     * @param {Message} message
     * @returns {Object}
     */
    const getSelectionEditor = (message) => {
        const { editor } = editorModel.find(message);
        return {
            editor,
            selection: editor && editor.getSelection()
        };
    };

    /**
     * Get the image from the current selection.
     * @param  {Message} message
     * @return {Node}
     */
    const getSelectedImg = (message) => {
        const { selection, editor } = getSelectionEditor(message);

        if (!editor) {
            return;
        }

        return angular
            .element(selection.commonAncestorContainer)
            .find('img')
            .filter(function() {
                /* eslint no-underscore-dangle: "off" */
                const range = editor._win.getSelection().getRangeAt(0);
                if (!range || !range.commonAncestorContainer) {
                    return false;
                }
                return range.commonAncestorContainer.contains(this);
            })[0];
    };

    /**
     * Get the current link at the cursor or the current selected item
     * @param  {Message} message
     * @return {Object}         {href: textContent};
     */
    function getLinkAtCursor(message) {
        const { selection, editor } = getSelectionEditor(message);
        const config = { href: LINK_DEFAULT, textContent: LINK_DEFAULT };

        if (!editor) {
            return config;
        }

        return (
            angular.element(selection.commonAncestorContainer).closest('a')[0] || {
                ...config,
                textContent: selection.toString()
            }
        );
    }

    return {
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/squire/squireModalListener.tpl.html'),
        scope: {
            message: '<',
            allowEmbedded: '<',
            allowDataUri: '<'
        },
        link(scope, $el) {
            const { message, allowEmbedded, allowDataUri } = scope;
            const { ID } = message;
            const fileInput = $el[0].querySelector('.addFile-fileInput');
            const { dispatcher } = dispatchers(['addFile']);

            /**
             * Close any active modal. Do it in the editor state first. Then
             * the listener will be triggered. This is to ensure that
             * everything is properly synchronized.
             */
            const closeModal = () => {
                editorState.set(ID, { popover: undefined });
            };

            const openAddLinkModal = () => {
                // Get the current link.
                const link = getLinkAtCursor(message);

                // Get the href and it's label.
                const { href, textContent: label } = link;
                // Get the link type (default to web).
                const type = linkToType(href);
                // Strip the tel: or mailto: prefix.
                const url = stripLinkPrefix(href);

                addLinkModal.activate({
                    params: {
                        isUpdate: !!href,
                        link: {
                            url,
                            label,
                            type
                        },
                        submit({ url, label, type }) {
                            closeModal();
                            squireExecAction.makeLink(message, {
                                link: formatLink(url, type),
                                title: label,
                                wrap: getSelectedImg(message)
                            });
                        },
                        delete() {
                            closeModal();
                            squireExecAction.removeLink(message);
                        },
                        cancel() {
                            closeModal();
                        }
                    }
                });
            };

            /**
             * Close the link modal.
             */
            const closeLinkModal = () => {
                addLinkModal.deactivate();
            };

            const openAddFileModal = () => {
                addFileModal.activate({
                    params: {
                        canAddFile: allowEmbedded || allowDataUri,
                        image: {
                            src: ''
                        },
                        submit({ src }) {
                            closeModal();
                            squireExecAction.insertImage(message, { url: src });
                        },
                        addFile() {
                            closeModal();
                            // When the add file button was clicked, check if we are only allowing
                            // data-uri on this message. Then open the file selector and insert the image
                            // directly once an image has been selected.
                            if (allowDataUri) {
                                fileInput.click();
                            } else if (allowEmbedded) {
                                // Else open the file dialog and the selector to choose "inline" or "attachment".
                                dispatcher.addFile('', {
                                    asEmbedded: true,
                                    message
                                });
                            }
                        },
                        cancel() {
                            closeModal();
                        }
                    }
                });
            };

            const closeFileModal = () => {
                addFileModal.deactivate();
            };

            /**
             * State change listener for the editor.
             * @param {Object} old state
             * @param {Object} new state
             */
            const onStateChange = ({ popover: oldPopover }, { popover }) => {
                if (popover === 'makeLink') {
                    openAddLinkModal();
                }
                if (oldPopover === 'makeLink') {
                    closeLinkModal();
                }
                if (popover === 'insertImage') {
                    openAddFileModal();
                }
                if (oldPopover === 'insertImage') {
                    closeFileModal();
                }
            };

            /**
             * Listener for when a file has been selected for the uri adding of files.
             * @param {DOMEvent} e
             */
            const onChangeFile = ({ target }) => {
                const files = target.files || [];
                if (files.length === 0) {
                    return;
                }
                const [file] = files;
                squireExecAction.insertImage(message, { url: '', file });
                // Reset input value to trigger the change event if you select the same file again
                target.value = null;
            };

            editorState.on(ID, onStateChange, ['popover']);
            fileInput.addEventListener('change', onChangeFile);

            scope.$on('$destroy', () => {
                editorState.off(ID, onStateChange);
                fileInput.removeEventListener('change', onChangeFile);
            });
        }
    };
}

export default squireModalListener;
