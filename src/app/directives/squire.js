angular.module("proton.squire", [
    "proton.tooltip"
])
.directive("squire", function(tools, $rootScope, $timeout, authentication, embedded, CONSTANTS, signatureBuilder) {
    return {
        scope: {
            message: '=', // body
            value: '=?', // body
            allowEmbedded: '=',
            allowDataUri: '='
        },
        replace: true,
        transclude: true,
        templateUrl: "templates/directives/squire.tpl.html",
        link(scope, element, { typeContent = 'message' }) {

            // Delay before updating the model as the process is slow
            const TIMEOUTAPP = 300;
            // For a type !== message vodoo magic "realtime"
            const timeout = (typeContent === 'message') ? TIMEOUTAPP : 32;

            /**
             * Check if this squire instance is for a message or not
             * Ex: you can work with a string intead of the message model
             *   => signature
             * @return {Boolean}
             */
            const isMessage = () => typeContent === 'message';

            var IFRAME_CLASS, LINK_DEFAULT, IMAGE_DEFAULT, editor, debounce, getLinkAtCursor, iframe, iframeLoaded, isChrome, isFF, isIE, isMac, loaded, ua, updateStylesToMatch;

            LINK_DEFAULT = IMAGE_DEFAULT = "";
            IFRAME_CLASS = 'angular-squire-iframe';
            const HEADER_CLASS = 'h4';
            let isLoaded = false;

            isMac = navigator.userAgent.indexOf('Mac OS X') !== -1;
            editor = scope.editor = null;
            scope.data = { link: LINK_DEFAULT, image: IMAGE_DEFAULT };

            scope.$on('$destroy', function() {
                if(angular.isDefined(editor)) {
                    editor.destroy();
                }
            });

            const DOC = document.createElement('DIV');

            function updateModel(val, dispatchAction = false) {

                const value = DOMPurify.sanitize(val);
                DOC.innerHTML = value;
                scope
                    .$applyAsync(() => {

                        const isEmpty = !DOC.textContent.trim().length;
                        element[`${isEmpty ? 'remove' : 'add'}Class`]('squire-has-value');

                        if (isMessage()) {
                            // Replace the embedded images with CID to keep the model updated
                            return embedded
                                .parser(scope.message, 'cid', value)
                                .then((body) => {
                                    scope.message.setDecryptedBody(body);

                                    // Dispatch an event to update the message
                                    dispatchAction && $rootScope.$emit('message.updated', {
                                        message: scope.message
                                    });
                                });
                        }

                        // We can work onto a string too
                        scope.value = value;

                    });
            }

            getLinkAtCursor = function() {
                if (!editor) {
                    return LINK_DEFAULT;
                }
                return angular.element(editor.getSelection().commonAncestorContainer).closest("a").attr("href");
            };

            function handleDrop(e) {
              e.stopPropagation();
              e.preventDefault();

              const file = e.dataTransfer.files[0];

              insertImage(file, e);
            }

            scope.canRemoveLink = function() {
                var href = getLinkAtCursor();

                return href && href !== LINK_DEFAULT;
            };

            scope.canAddLink = function() {
                return scope.data.link && scope.data.link !== LINK_DEFAULT;
            };

            scope.canAddImage = function() {
                return scope.data.image && scope.data.image !== IMAGE_DEFAULT;
            };

            scope.popoverHide = function(event, name) {
                var hide = function() {
                    element.find('.squire-popover.' + name).hide();

                    if (name) {
                        return scope.action(name);
                    }
                };

                if (event.keyCode) {
                    if (event.keyCode === 13) {
                        return hide();
                    }
                } else {
                    return hide();
                }
            };

            scope.popoverShow = function(e, name) {
                if (element.find('.squire-popover.' + name).is(':visible')) {
                    element.find('.squire-popover.' + name).hide();
                } else {
                    element.find('.squire-popover').hide();

                    if (/>A\b/.test(editor.getPath()) || editor.hasFormat('A')) {
                        scope.data.link = getLinkAtCursor();
                    } else {
                        scope.data.link = LINK_DEFAULT;
                    }

                    element.find('.squire-popover.' + name).show();
                    element.find('.squire-popover.' + name).find('input').focus().end();
                }
            };

            /**
             * Insert data-uri image from File
             * @param {File} file
             */
            function insertImage(file, evt) {
                const reader = new FileReader();

                reader.addEventListener('load', () => {
                    const dataURI = reader.result;

                    editor.insertImage(dataURI, {class: 'proton-embedded', alt: file.name});
                    scope.popoverHide(evt, 'insertImage');
                }, false);

                if (file && file.type.match('image.*')) {
                    reader.readAsDataURL(file);
                }
            }

            scope.insertDataUri = ($event) => {
                const input = element[0].querySelector('input[type=file]');

                input.onchange = (e) => {
                    const file = input.files[0];

                    insertImage(file, $event);
                };

                if (input && document.createEvent) {
                    const evt = document.createEvent('MouseEvents');

                    evt.initEvent('click', true, false);
                    input.dispatchEvent(evt);
                }
            };

            updateStylesToMatch = function(doc) {
                var head = doc.head || doc.getElementsByTagName('head')[0];
                var style = doc.createElement('style');

                var css = "html{height:100%} body {height:100%; box-sizing:border-box; padding: 1rem 10px 1rem 10px; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; font-size: 14px; line-height: 1.65em; color: #222; } blockquote { padding: 0 0 0 1rem; margin: 0; border-left: 4px solid #e5e5e5; } blockquote blockquote blockquote { padding-left: 0; margin-left: 0; border: none; } .proton-embedded{ max-width:100%; height:auto; } .protonmail_signature_block-empty {display: none}";

                style.setAttribute('type', 'text/css');
                style.setAttribute('rel', 'stylesheet');
                if (style.styleSheet){
                    style.styleSheet.cssText = css;
                }
                else {
                    style.appendChild(doc.createTextNode(css));
                }
                head.appendChild(style);

                doc.childNodes[0].className = IFRAME_CLASS + " ";
                if (scope.editorClass) {
                    return doc.childNodes[0].className += scope.editorClass;
                }
            };

            iframeLoaded = function() {
                var iframeDoc = iframe[0].contentWindow.document;

                updateStylesToMatch(iframeDoc);
                // ngModel.$setPristine();
                editor = new Squire(iframeDoc);


                if (isMessage()) {
                    // On load we parse the body of the message in order to load its embedded images
                    embedded
                        .parser(scope.message)
                        .then((body) => (editor.setHTML(body), isLoaded = true));
                } else {
                    editor.setHTML(scope.value || '');

                    // defer loading to prevent input event refresh (takes some time to perform the setHTML)
                    const id = setTimeout(() => {
                        isLoaded = true;
                        clearTimeout(id);
                    }, 100);
                }


                editor.addEventListener("pathChange", _.throttle(() => {
                    const p = editor.getPath();
                    const node = element[0].querySelector('.add-link');

                    if (node) {
                        if (/>A\b/.test(p) || editor.hasFormat('A')) {
                            node.classList.add('active');
                        } else {
                            node.classList.remove('active');
                        }
                    }

                    if ('(selection)' !== p) {

                        /**
                         * Find and filter selections to toogle the current action (toolbar)
                         * Ex: isBold etc.
                         */
                        const classNames = _
                            .chain(p.split('BODY')[1].split('>'))
                            .filter(i => i && !/IMG.proton-embedded|.proton-embedded|DIV.image.loading/i.test(i))
                            .reduce((acc, path) => acc.concat(path.split('.')), [])
                            .filter(i => i && !/div|html|body|span/i.test(i))
                            .reduce((acc, key) => {
                              if (HEADER_CLASS === key) {
                                  return `${acc} size`;
                              }
                              return `${acc} ${key.trim()}`;
                            }, '')
                            .value()
                            .toLowerCase()
                            .trim();

                        menubar[0].className = `squire-toolbar ${classNames}`;
                    }

                }), 500);

                // Only update the model every 300ms or at least 2 times before saving a draft
                editor.addEventListener('input', _.throttle(() => {
                    isLoaded && updateModel(editor.getHTML());
                }, timeout));

                editor.addEventListener('refresh', ({ Body = '', action = '', data } = {}) => {

                    if (action === 'attachment.remove') {
                        embedded.removeEmbedded(scope.message, data, editor.getHTML());
                    }

                    if (action === 'message.changeFrom') {
                        const html = signatureBuilder.update(scope.message, editor.getHTML());
                        editor.setHTML(html);
                        return updateModel(html, true);
                    }

                    if (isMessage()) {
                        // Replace the embedded images with CID to keep the model updated
                        return embedded
                            .parser(scope.message)
                            .then((body) => (editor.setHTML(body), body))
                            .then(updateModel);
                    }

                    editor.setHTML(Body);
                    updateModel(Body);
                });

                editor.addEventListener('focus', function() {
                    element.addClass('focus').triggerHandler('focus');
                    $rootScope.$broadcast('editorFocussed', element, editor);
                });

                editor.addEventListener('purify', function(event) {
                    // triggered by Squire at paste event, before all dom injection
                    event.string = DOMPurify.sanitize(event.string);
                    return event;

                });

                editor.addEventListener('blur', function() {
                    element.removeClass('focus').triggerHandler('blur');
                });

                editor.addEventListener("mscontrolselect", function(event) {
                    event.preventDefault();
                });


                editor.alignRight = function() {
                    return editor.setTextAlignment("right");
                };

                editor.alignCenter = function() {
                    return editor.setTextAlignment("center");
                };

                editor.alignLeft = function() {
                    return editor.setTextAlignment("left");
                };

                editor.alignJustify = function() {
                    return editor.setTextAlignment("justify");
                };

                editor.makeHeading = function() {
                    editor.setFontSize("2em");

                    return editor.bold();
                };

                if (isMac === true) {
                    editor.setKeyHandler('meta-enter', function(self, event, range) {
                        if (authentication.user.Hotkeys === 1) {
                            event.preventDefault();
                            $rootScope.$broadcast('sendMessage', element);
                        }
                    });
                } else {
                    editor.setKeyHandler('ctrl-enter', function(self, event, range) {
                        if (authentication.user.Hotkeys === 1) {
                            event.preventDefault();
                            $rootScope.$broadcast('sendMessage', element);
                        }
                    });
                }

                editor.setKeyHandler('escape', function(self, event, range) {
                    if (authentication.user.Hotkeys === 1) {
                        $rootScope.$broadcast('closeMessage', element);
                    }
                });

                editor.addEventListener('drop', handleDrop, false);

                $rootScope.$broadcast('editorLoaded', element, editor);
            };

            iframe = element.find('iframe.squireIframe');
            var iframeDoc = iframe.contentDocument || iframe.contentWindow && iframe.contentWindow.document;
            menubar = element.find('.squire-toolbar');
            loaded = false;

            // Check if browser is Webkit (Safari/Chrome) or Opera
            if(
                ( jQuery.browser && (jQuery.browser.webkit || jQuery.browser.opera || jQuery.browser.chrome) ) ||
                ( $('body').hasClass('ua-safari') || $('body').hasClass('ua-opera') || $('body').hasClass('ua-chrome'))
            ) {
                // Start timer when loaded.
                $(iframe).load(function () {
                    loaded = true;
                    iframeLoaded();
                });

                // Safari and Opera need a kick-start.
                var source = $(iframe).attr('src');

                $(iframe).attr('src', '');
                $(iframe).attr('src', source);
            } else {
                // For other browsers.
                if(iframeDoc && iframeDoc.readyState  === 'complete') {
                    loaded = true;
                    iframeLoaded();
                } else {
                    $(iframe).load(function() {
                        loaded = true;
                        iframeLoaded();
                    });
                }
            }

            Squire.prototype.testPresenceinSelection = function(name, action, format, validation) {
                var p, test;
                p = this.getPath();
                test = validation.test(p) | this.hasFormat(format);
                return name === action && test;
            };

            scope.action = function(action) {
                var node, range, selection, test;

                if (!editor) {
                    return;
                }

                test = {
                    value: action,
                    testBold: editor.testPresenceinSelection("bold", action, "B", />B\b/),
                    testItalic: editor.testPresenceinSelection("italic", action, "I", />I\b/),
                    testUnderline: editor.testPresenceinSelection("underline", action, "U", />U\b/),
                    testOrderedList: editor.testPresenceinSelection("makeOrderedList", action, "OL", />OL\b/),
                    testUnorderedList: editor.testPresenceinSelection("makeUnorderedList", action, "UL", />UL\b/),
                    testLink: editor.testPresenceinSelection("removeLink", action, "A", />A\b/),
                    testQuote: editor.testPresenceinSelection("increaseQuoteLevel", action, "blockquote", />blockquote\b/),
                    isNotValue: function(a) {
                        return a === action && this.value !== "";
                    }
                };

                if (test.testBold || test.testItalic || test.testUnderline || test.testOrderedList || test.testUnorderedList || test.testQuote || test.testLink) {
                    if (test.testBold) {
                        editor.removeBold();
                    }
                    if (test.testItalic) {
                        editor.removeItalic();
                    }
                    if (test.testUnderline) {
                        editor.removeUnderline();
                    }
                    if (test.testOrderedList) {
                        editor.removeList();
                    }
                    if (test.testUnorderedList) {
                        editor.removeList();
                    }
                    if (test.testQuote) {
                        editor.decreaseQuoteLevel();
                    }
                    if (test.testLink) {
                        editor.removeLink();
                        return editor.focus();
                    }
                } else if (test.isNotValue("removeLink")) {

                } else if (action === 'makeLink') {
                    if (scope.canAddLink()) {
                        node = angular.element(editor.getSelection().commonAncestorContainer).closest('a')[0];

                        if (node) {
                            range = iframe[0].contentWindow.document.createRange();
                            range.selectNodeContents(node);
                            selection = iframe[0].contentWindow.getSelection();
                            selection.removeAllRanges();
                            selection.addRange(range);
                        }

                        editor.makeLink(scope.data.link, {
                            target: '_blank',
                            title: scope.data.link,
                            rel: "nofollow"
                        });

                        scope.data.link = LINK_DEFAULT;

                        editor.focus();
                    }
                } else if(action === 'insertImage') {
                    if(scope.data.image.length > 0) {
                        editor.insertImage(scope.data.image, {"class": 'proton-embedded'});
                        scope.data.image = '';
                    }

                    editor.focus();
                } else {
                    editor[action]();
                }
            };
        }
    };
});
