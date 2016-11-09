angular.module('proton.squire')
    .factory('squireEditor', ($rootScope, CONSTANTS, editorModel) => {

        const IFRAME_CLASS = CONSTANTS.DEFAULT_SQUIRE_VALUE.IFRAMECLASSNAME;

        Squire.prototype.testPresenceinSelection = function (name, action, format, validation) {

            if (name !== action) {
                return false;
            }

            const test = validation.test(this.getPath()) | this.hasFormat(format);
            return !!test;
        };

        /**
         * Load an iframe
         * @param  {jQLite}   $iframe
         * @param  {Function} cb      Callback on load
         * @return {void}
         */
        const loadIframe = ($iframe, cb) => {
            const iframe = $iframe[0];
            const iframeDoc = (iframe.contentDocument || iframe.contentWindow) && iframe.contentWindow.document;

            const { webkit, opera, chrome } = (jQuery.browser || {});
            const hasClass = (name) => document.body.classList.contains(name);

            // Check if browser is Webkit (Safari/Chrome) or Opera
            if (
                (webkit || opera || chrome) ||
                (hasClass('ua-safari') || hasClass('ua-opera') || hasClass('ua-chrome'))
            ) {
                // Start timer when loaded.
                $iframe.load(() => cb($iframe));

                // Safari and Opera need a kick-start.
                const source = iframe.getAttribute('src');
                iframe.setAttribute('src', '');
                return iframe.setAttribute('src', source);

            }

            if (iframeDoc && iframeDoc.readyState === 'complete') {
                return cb($iframe);
            }

            $iframe.load(() => cb($iframe));
        };

        /**
         * Custom CSS inside the IFRAME
         * @param  {Node} doc
         * @return {void}
         */
        const updateStylesToMatch = (doc) => {
            const head = doc.head || doc.getElementsByTagName('head')[0];
            const style = doc.createElement('style');

            const css = "html{height:100%} body {height:100%; box-sizing:border-box; padding: 1rem 10px 1rem 10px; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; font-size: 14px; line-height: 1.65em; color: #222; } blockquote { padding: 0 0 0 1rem; margin: 0; border-left: 4px solid #e5e5e5; } blockquote blockquote blockquote { padding-left: 0; margin-left: 0; border: none; } .proton-embedded{ max-width:100%; height:auto; } .protonmail_signature_block-empty {display: none}";

            style.setAttribute('type', 'text/css');
            style.setAttribute('rel', 'stylesheet');
            if (style.styleSheet) {
                style.styleSheet.cssText = css;
            } else {
                style.appendChild(doc.createTextNode(css));
            }
            head.appendChild(style);

            doc.childNodes[0].className = IFRAME_CLASS + ' ';
        };

        /**
         * Extend the EDITOR api
         * @param  {Squire} editor
         * @return {Squire}        Editor
         */
        const extendApi = (editor) => {
            editor.alignRight = () => editor.setTextAlignment('right');
            editor.alignCenter = () => editor.setTextAlignment('center');
            editor.alignLeft = () => editor.setTextAlignment('left');
            editor.alignJustify = () => editor.setTextAlignment('justify');
            editor.makeHeading = () => {
                editor.setFontSize('2em');
                return editor.bold();
            };
            return editor;
        };

        /**
         * Create a new instance of Squire and store it
         * Dispatch a squire.editor action (type: loaded) on load
         * @param  {jQLite} $iframe
         * @param  {Message} message
         * @return {Promise}
         */
        const create = ($iframe, message = {}) => {
            const { ID = 'editor' } = message;
            return new Promise((resolve, reject) => {
                try {
                    loadIframe($iframe, ($iframe) => {
                        const iframeDoc = $iframe[0].contentWindow.document;
                        updateStylesToMatch(iframeDoc);
                        const editor = editorModel.load({ ID }, extendApi(new Squire(iframeDoc)), $iframe);

                        $rootScope.$emit('squire.editor', {
                            type: 'loaded',
                            data: { editor, $iframe, message }
                        });
                        resolve(editor, $iframe);
                    });
                } catch (e) {
                    console.error(e);
                    reject(e);
                }
            });
        };

        return { create };
    });
