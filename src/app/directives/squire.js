angular.module("proton.squire", [
    "proton.tooltip"
])
.directive("squire", function(tools) {
    return {
        restrict: 'E',
        require: "ngModel",
        scope: {
            height: '@',
            width: '@',
            placeholder: '@',
            editorClass: '@',
            editor: '=',
            ngModel: '=',
            message: '='

        },
        replace: true,
        transclude: true,
        templateUrl: "templates/directives/squire.tpl.html",

        /* @ngInject */
        controller: function($scope, $rootScope, $sanitize, tools) {
            var editorVisible;
            editorVisible = true;

            $scope.selectFile = function(message) {
                $('#' + message.button).click();
            };

            $scope.isEditorVisible = function() {
                return editorVisible;
            };

            $scope.isPlain = function() {
                var result = false;

                if($scope.data.format === 'plain') {
                    result = true;
                }

                if($rootScope.isMobile && $rootScope.browser === 'Safari') {
                    result = true;
                }

                return result;
            };

            $scope.isHtml = function() {
                var result = false;

                if($scope.data.format === 'html') {
                    result = true;
                }

                return result;
            };

            $scope.editorVisibility = this.editorVisibility = function(vis) {
                var _ref;
                if (arguments.length === 1) {
                    editorVisible = vis;
                    if (vis) {
                    return (_ref = $scope.editor) !== null ? _ref.focus() : void 0;
                    }
                } else {
                    return editorVisible;
                }
            };
        },
        link: function(scope, element, attrs, ngModel) {
            var IFRAME_CLASS, LINK_DEFAULT, IMAGE_DEFAULT, editor, getLinkAtCursor, iframe, iframeLoaded, isChrome, isFF, isIE, loaded, menubar, ua, updateModel, updateStylesToMatch;
            LINK_DEFAULT = IMAGE_DEFAULT ="http://";
            IFRAME_CLASS = 'angular-squire-iframe';
            editor = scope.editor = null;
            scope.data = {
                link: LINK_DEFAULT,
                image: IMAGE_DEFAULT,
                format: 'html'
            };
            updateModel = function(value) {
                return scope.$evalAsync(function() {
                    ngModel.$setViewValue(value);
                    if (ngModel.$isEmpty(value)) {
                        return element.removeClass('squire-has-value');
                    } else {
                        return element.addClass('squire-has-value');
                    }
                });
            };
            ngModel.$render = function() {
                return editor !== null ? editor.setHTML(ngModel.$viewValue || '') : void 0;
            };
            ngModel.$isEmpty = function(value) {
                if (angular.isString(value)) {
                    return angular.element("<div>" + value + "</div>").text().trim().length === 0;
                } else {
                    return !value;
                }
            };
            getLinkAtCursor = function() {
                if (!editor) {
                    return LINK_DEFAULT;
                }
                return angular.element(editor.getSelection().commonAncestorContainer).closest("a").attr("href");
            };
            scope.canRemoveLink = function() {
                var href;
                href = getLinkAtCursor();
                return href && href !== LINK_DEFAULT;
            };
            scope.canAddLink = function() {
                return scope.data.link && scope.data.link !== LINK_DEFAULT;
            };
            scope.canAddImage = function() {
              return scope.data.image && scope.data.image !== IMAGE_DEFAULT;
            };
            scope.$on('$destroy', function() {
                return editor !== null ? editor.destroy() : void 0;
            });
            scope.showPlaceholder = function() {
                return ngModel.$isEmpty(ngModel.$viewValue);
            };
            scope.popoverHide = function(e, name) {
                var hide;
                hide = function() {
                    angular.element(e.target).closest(".popover-visible").removeClass("popover-visible");
                    return scope.action(name);
                };
                if (e.keyCode) {
                    if (e.keyCode === 13) {
                        return hide();
                    }
                } else {
                    return hide();
                }
            };
            scope.popoverShow = function(e) {
                var linkElement, popover, liElement;
                linkElement = angular.element(e.currentTarget);
                liElement = angular.element(linkElement).parent();
                if (angular.element(e.target).closest(".squire-popover").length) {
                    return;
                }
                if (linkElement.hasClass("popover-visible")) {
                    return;
                }
                linkElement.addClass("popover-visible");
                if (/>A\b/.test(editor.getPath()) || editor.hasFormat('A')) {
                    scope.data.link = getLinkAtCursor();
                } else {
                    scope.data.link = LINK_DEFAULT;
                }
                popover = element.find(".squire-popover").find("input").focus().end();
                popover.css({
                    left: -1 * (popover.width() / 2) + liElement.width() / 2
                });
            };
            scope.switchTo = function(format) {
                var value = editor.getHTML();
                var end;

                if(format === 'plain') {
                    // TODO manage blockquote
                    // var start = tools.block(html, 'start');
                    // var plain = tools.plaintext(start);
                    // var quote = tools.quote(plain);
                    // var end = tools.block(quote.replace(/<br\s*[\/]?>/gi, "\n"), 'end');
                    end = tools.plaintext(value);
                    scope.data.format = format;
                } else if (format === 'html') {
                    end = tools.html(value);
                    scope.data.format = format;
                }

                updateModel(end);
            };
            updateStylesToMatch = function(doc) {
                var head;
                head = doc.head;
                _.each(angular.element('link'), function(el) {
                    var a;
                    a = doc.createElement('link');
                    a.setAttribute('href', el.href);
                    a.setAttribute('type', 'text/css');
                    a.setAttribute('rel', 'stylesheet');
                    return head.appendChild(a);
                });
                doc.childNodes[0].className = IFRAME_CLASS + " ";
                if (scope.editorClass) {
                    return doc.childNodes[0].className += scope.editorClass;
                }
            };
            iframe = element.find('iframe.squireIframe');
            menubar = element.find('.menu');
            iframeLoaded = function() {
                var iframeDoc = iframe[0].contentWindow.document;
                updateStylesToMatch(iframeDoc);
                ngModel.$setPristine();
                editor = scope.editor = new Squire(iframeDoc);
                editor.defaultBlockTag = 'P';
                if (scope.body) {
                    editor.setHTML(scope.body);
                    updateModel(scope.body);
                }
                editor.addEventListener("input", function() {
                    var html = editor.getHTML();

                    updateModel(html);
                });
                editor.addEventListener("focus", function() {
                    element.addClass('focus').triggerHandler('focus');
                    scope.editorVisibility(true);
                });
                editor.addEventListener("blur", function() {
                    element.removeClass('focus').triggerHandler('blur');

                    if (ngModel.$pristine && !ngModel.$isEmpty(ngModel.$viewValue)) {
                        ngModel.$setTouched();
                    } else {
                        ngModel.$setPristine();
                    }
                });
                editor.addEventListener("pathChange", function() {
                    var p, _ref;
                    p = editor.getPath();
                    if (/>A\b/.test(p) || editor.hasFormat('A')) {
                        element.find('.add-link').addClass('active');
                    } else {
                        element.find('.add-link').removeClass('active');
                    }
                    return menubar.attr("class", "menu " + ((_ref = p.split("BODY")[1]) !== null ? _ref.replace(/>|\.|html|body|div/ig, ' ').toLowerCase() : void 0));
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
            };
            ua = navigator.userAgent;
            isChrome = /Chrome/.test(ua);
            isIE = /rv:11.0|IE/.test(ua);
            isFF = !isChrome && !isIE;
            loaded = false;
            iframe.on('load', function() {
                loaded = true;

                return loaded;
            });
            if (isChrome) {
                iframeLoaded();
            } else {
                element.one("mouseenter", function() {
                    if (isFF) {
                        if (loaded) {
                            return iframeLoaded();
                        } else {
                            return iframe.on('load', iframeLoaded);
                        }
                    } else {
                        return iframeLoaded();
                    }
                });
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
                    if (!scope.canAddLink()) {
                        return;
                    }
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
                    return editor.focus();
                } else if(action === 'insertImage') {
                  editor.insertImage(scope.data.image);
                  return editor.focus();
                } else {
                    editor[action]();
                    return editor.focus();
                }
            };
        }
    };
}).directive("squireCover", function() {
    return {
        restrict: 'E',
        replace: true,
        transclude: true,
        require: "^squire",
        template: "<ng-transclude ng-show=\"isCoverVisible()\"\n    ng-click='hideCover()'\n    class=\"angular-squire-cover\">\n</ng-transclude>",
        link: function(scope, element, attrs, editorCtrl) {
            var showingCover;
            showingCover = true;
            scope.isCoverVisible = function() {
                return showingCover;
            };
            scope.hideCover = function() {
                showingCover = false;
                return editorCtrl.editorVisibility(true);
            };
            editorCtrl.editorVisibility(!showingCover);
            return scope.$watch(function() {
                return editorCtrl.editorVisibility();
            }, function(val) {
                showingCover = !val;

                return showingCover;
            });
        }
    };
}).directive("squireControls", function() {
    return {
        restrict: 'E',
        scope: false,
        replace: true,
        transclude: true,
        require: "^squire",
        template: "<ng-transclude ng-show=\"isControlsVisible()\"\n    class=\"angular-squire-controls\">\n</ng-transclude>",
        link: function(scope, element, attrs, editorCtrl) {
            scope.isControlsVisible = function() {
                return editorCtrl.editorVisibility();
            };
        }
    };
});
