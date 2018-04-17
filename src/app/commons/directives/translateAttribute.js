// Adapted from https://github.com/rubenv/angular-gettext/blob/master/src/directive.js
function generateDirective(attrName) {
    function normalizeAttributeName(attributeName) {
        // copied from angular.js v1.2.2
        // (c) 2010-2012 Google, Inc. http://angularjs.org
        // License: MIT
        // Copied from http://thetoeb.de/2014/01/14/angular-normalized-attribute-names/
        // Modified to escape hyphens in the regexs

        const SPECIAL_CHARS_REGEXP = /([:\-_]+(.))/g;
        const MOZ_HACK_REGEXP = /^moz([A-Z])/;

        function camelCase(name) {
            return name
                .replace(SPECIAL_CHARS_REGEXP, (_, separator, letter, offset) => {
                    return offset ? letter.toUpperCase() : letter;
                })
                .replace(MOZ_HACK_REGEXP, 'Moz$1');
        }

        const PREFIX_REGEXP = /^(x[:\-_]|data[:\-_])/i;

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

    const normAttrName = normalizeAttributeName(attrName);

    return [
        'gettextCatalog',
        '$parse',
        '$animate',
        '$compile',
        function(gettextCatalog, $parse, $animate, $compile) {
            return {
                restrict: 'A',
                terminal: true,
                priority: 1000,
                compile(element, attrs) {
                    // Validate attributes
                    if (!attrs[normAttrName + 'Translate']) {
                        throw new Error('Missing ' + normAttrName + '-translate attribute!');
                    }
                    assert(
                        !attrs[normAttrName + 'TranslatePlural'] || attrs[normAttrName + 'TranslateN'],
                        normAttrName + 'translate-n',
                        normAttrName + 'translate-plural'
                    );
                    assert(
                        !attrs[normAttrName + 'TranslateN'] || attrs[normAttrName + 'TranslatePlural'],
                        normAttrName + 'translate-plural',
                        normAttrName + 'translate-n'
                    );

                    const msgid = attrs[normAttrName + 'Translate'];
                    const translatePlural = attrs[normAttrName + 'TranslatePlural'];
                    const translateContext = attrs[normAttrName + 'TranslateContext'];

                    return {
                        pre(scope, element, attrs) {
                            const attribute = attrs[normAttrName + 'TranslateN'];
                            const countFn = attribute ? angular.noop : $parse(attribute);
                            let pluralScope = null;

                            function update() {
                                // Fetch correct translated string.
                                let translated;
                                if (translatePlural) {
                                    /* eslint no-param-reassign: "off" */
                                    scope = pluralScope || (pluralScope = scope.$new());
                                    scope.$count = countFn(scope);
                                    translated = gettextCatalog.getPlural(
                                        scope.$count,
                                        msgid,
                                        translatePlural,
                                        null,
                                        translateContext
                                    );
                                } else {
                                    translated = gettextCatalog.getString(msgid, null, translateContext);
                                }

                                const oldContents = attrs[normAttrName];

                                // Avoid redundant swaps
                                if (translated === oldContents) {
                                    return;
                                }

                                // Swap in the translation
                                element[0].setAttribute(attrName, translated);
                            }

                            if (attribute) {
                                scope.$watch(attribute, update);
                            }

                            /**
                             * @ngdoc event
                             * @name translate#gettextLanguageChanged
                             * @eventType listen on scope
                             * @description Listens for language updates and changes translation accordingly
                             */
                            scope.$on('gettextLanguageChanged', update);

                            update();

                            element.removeAttr(attrName + '-translate');

                            $compile(element)(scope);
                        }
                    };
                }
            };
        }
    ];
}

export default {
    placeholder: generateDirective('placeholder'),
    title: generateDirective('title'),
    tooltip: generateDirective('pt-tooltip')
};
