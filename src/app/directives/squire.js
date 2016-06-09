angular.module("proton.squire", [
    "proton.tooltip"
])
.directive("squire", function(tools, $rootScope, $timeout) {
    return {
        restrict: 'E',
        require: "ngModel",
        priority: 99,
        scope: {
            ngModel: '=' // body
        },
        replace: true,
        transclude: true,
        templateUrl: "templates/directives/squire.tpl.html",
        link: function(scope, element, attrs, ngModel) {
            if (!ngModel) { return; } // do nothing if no ng-model

            var IFRAME_CLASS, LINK_DEFAULT, IMAGE_DEFAULT, editor, debounce, getLinkAtCursor, iframe, iframeLoaded, isChrome, isFF, isIE, isMac, loaded, menubar, ua, updateModel, updateStylesToMatch;

            LINK_DEFAULT = IMAGE_DEFAULT = "";
            IFRAME_CLASS = 'angular-squire-iframe';
            HEADER_CLASS = 'h4';
            isMac = navigator.userAgent.indexOf('Mac OS X') !== -1;
            editor = scope.editor = null;
            scope.data = { link: LINK_DEFAULT, image: IMAGE_DEFAULT };

            scope.$on('$destroy', function() {
                if(angular.isDefined(editor)) {
                    editor.destroy();
                }
            });

            updateModel = function(value) {
                value = DOMPurify.sanitize(value);
                $timeout.cancel(debounce);
                debounce = $timeout(function() {
                    ngModel.$setViewValue(value);

                    if (ngModel.$isEmpty(value)) {
                        element.removeClass('squire-has-value');
                    } else {
                        element.addClass('squire-has-value');
                    }
                }, 200);
            };

            getLinkAtCursor = function() {
                if (!editor) {
                    return LINK_DEFAULT;
                }
                return angular.element(editor.getSelection().commonAncestorContainer).closest("a").attr("href");
            };

            // Specify how UI should be updated
            ngModel.$render = function() {
                if(editor) {
                    editor.setHTML(ngModel.$viewValue || '');
                }
            };

            ngModel.$isEmpty = function(value) {
                if (angular.isString(value)) {
                    return angular.element("<div>" + value + "</div>").text().trim().length === 0;
                } else {
                    return !value;
                }
            };

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
                var linkElement = angular.element(event.currentTarget);
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

            updateStylesToMatch = function(doc) {
                var head = doc.head || doc.getElementsByTagName('head')[0];
                var style = doc.createElement('style');

                var css = "html{height:100%} body {height:100%; box-sizing:border-box; padding: 1rem 10px 1rem 10px; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; font-size: 14px; line-height: 1.65em; color: #222; } blockquote { padding: 0 0 0 1rem; margin: 0; border-left: 4px solid #e5e5e5; } blockquote blockquote blockquote { padding-left: 0; margin-left: 0; border: none; }";

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
                ngModel.$setPristine();
                editor = new Squire(iframeDoc);

                if (scope.ngModel) {
                    editor.setHTML(scope.ngModel);
                    updateModel(scope.ngModel);
                }

                editor.addEventListener('input', function() {
                    var html = editor.getHTML();

                    updateModel(html);
                });

                editor.addEventListener('focus', function() {
                    element.addClass('focus').triggerHandler('focus');
                    $rootScope.$broadcast('editorFocussed', element, editor);
                });

                editor.addEventListener('willPaste', function(event) {
                    var div = document.createElement('div');

                    div.appendChild(event.fragment);
                    event.fragment = DOMPurify.sanitize(div.innerHTML, {RETURN_DOM_FRAGMENT: true});
                });

                editor.addEventListener('blur', function() {
                    element.removeClass('focus').triggerHandler('blur');

                    if (ngModel.$pristine && !ngModel.$isEmpty(ngModel.$viewValue)) {
                        ngModel.$setTouched();
                    } else {
                        ngModel.$setPristine();
                    }
                });

                editor.addEventListener("mscontrolselect", function(event) {
                    event.preventDefault();
                });

                editor.addEventListener("pathChange", function() {
                    var p, ref;

                    p = editor.getPath();

                    if (/>A\b/.test(p) || editor.hasFormat('A')) {
                        element.find('.add-link').addClass('active');
                    } else {
                        element.find('.add-link').removeClass('active');
                    }

                    menubar.attr("class", "squire-toolbar " + p.split("BODY")[1].replace(/>|\.|html|body|div/ig, ' ').replace(RegExp(HEADER_CLASS, 'g'), 'size').toLowerCase());
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
                        $rootScope.$broadcast('sendMessage', element);
                    });
                } else {
                    editor.setKeyHandler('ctrl-enter', function(self, event, range) {
                        $rootScope.$broadcast('sendMessage', element);
                    });
                }

                editor.setKeyHandler('escape', function(self, event, range) {
                    $rootScope.$broadcast('closeMessage', element);
                });

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

                        var reg = /^((http|https|ftp):\/\/)/;

                        if(!reg.test(scope.data.link)) { scope.data.link = "http://" + scope.data.link; }

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
                        editor.insertImage(scope.data.image);
                        scope.data.image = '';
                    }

                    editor.focus();
                } else {
                    editor[action]();
                    editor.focus();
                }
            };
        }
    };
});
