// Adapted from https://github.com/rubenv/angular-gettext/blob/master/src/directive.js

function generateDirective( attrName ) {

    function normalizeAttributeName(attributeName) {
        // copied from angular.js v1.2.2
        // (c) 2010-2012 Google, Inc. http://angularjs.org
        // License: MIT
        // Copied from http://thetoeb.de/2014/01/14/angular-normalized-attribute-names/
        // Modified to escape hyphens in the regexs

        var SPECIAL_CHARS_REGEXP = /([:\-_]+(.))/g;
        var MOZ_HACK_REGEXP = /^moz([A-Z])/;

        function camelCase(name) {
            return name.replace(SPECIAL_CHARS_REGEXP, function (_, separator, letter, offset) {
                return offset ? letter.toUpperCase() : letter;
            }).replace(MOZ_HACK_REGEXP, 'Moz$1');
        }

        var PREFIX_REGEXP = /^(x[:\-_]|data[:\-_])/i;

        function directiveNormalize(name) {
            return camelCase(name.replace(PREFIX_REGEXP, ''));
        }
        return directiveNormalize(attributeName);
    }

    function assert(condition, missing, found) {
        if (!condition) {
            throw new Error('You should add a ' + missing + ' attribute whenever you add a ' + found + ' attribute.');
        }
    }

    var normAttrName = normalizeAttributeName( attrName );
    console.log(normAttrName);

    return function (gettextCatalog, $parse, $animate, $compile, $window) {

        var msie = parseInt((/msie (\d+)/.exec(angular.lowercase($window.navigator.userAgent)) || [])[1], 10);

        return {
            restrict: 'A',
            terminal: true,
            priority: 1000,
            compile: function compile(element, attrs) {
                // Validate attributes
                if(!attrs[normAttrName+'Translate']) {
                    throw new Error('Missing '+normAttrName+'-translate attribute!');
                }
                assert(!attrs[normAttrName+'TranslatePlural'] || attrs[normAttrName+'TranslateN'], normAttrName+'translate-n', normAttrName+'translate-plural');
                assert(!attrs[normAttrName+'TranslateN'] || attrs[normAttrName+'TranslatePlural'], normAttrName+'translate-plural', normAttrName+'translate-n');

                var msgid = attrs[normAttrName+'Translate'];
                var translatePlural = attrs[normAttrName+'TranslatePlural'];
                var translateN = attrs[normAttrName+'TranslateN'];
                var translateContext = attrs[normAttrName+'TranslateContext'];

                if (msie <= 8) {
                    // Workaround fix relating to angular adding a comment node to
                    // anchors. angular/angular.js/#1949 / angular/angular.js/#2013
                    if (msgid.slice(-13) === '<!--IE fix-->') {
                        msgid = msgid.slice(0, -13);
                    }
                }

                return {
                    pre: function (scope, element, attrs) {
                        var countFn = $parse(attrs[normAttrName+'TranslateN']);
                        var pluralScope = null;

                        function update() {
                            // Fetch correct translated string.
                            var translated;
                            if (translatePlural) {
                                scope = pluralScope || (pluralScope = scope.$new());
                                scope.$count = countFn(scope);
                                translated = gettextCatalog.getPlural(scope.$count, msgid, translatePlural, null, translateContext);
                            } else {
                                translated = gettextCatalog.getString(msgid, null, translateContext);
                            }

                            var oldContents = attrs[normAttrName];

                            // Avoid redundant swaps
                            if (translated === oldContents){
                                return;
                            }

                            // Swap in the translation
                            element.attr(attrName, translated);
                        }

                        if (attrs[normAttrName+'TranslateN']) {
                            scope.$watch(attrs[normAttrName+'TranslateN'], update);
                        }

                        /**
                         * @ngdoc event
                         * @name translate#gettextLanguageChanged
                         * @eventType listen on scope
                         * @description Listens for language updates and changes translation accordingly
                         */
                        scope.$on('gettextLanguageChanged', update);

                        update();

                        element.removeAttr(attrName+'-translate');

                        $compile(element)(scope);
                    }
                };
            }
        };
    };
}

angular.module('proton.translate', [])
.directive('placeholderTranslate', generateDirective( 'placeholder' ))
.directive('titleTranslate', generateDirective( 'title' ))
.directive('ptTooltipTranslate', generateDirective( 'pt-tooltip' ));

