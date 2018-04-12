import _ from 'lodash';

/* @ngInject */
function sieveLabelInput() {
    return {
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/filter/sieveLabelInput.tpl.html'),
        scope: {
            sieve: '='
        },
        link: {
            /*
                    We need to run this prelink so the scope is set up before ui-codemirror
                 */
            pre(scope, elem) {
                const unsubscribe = [];

                scope.codeMirrorOptions = {
                    lineWrapping: true,
                    lineNumbers: true,
                    readOnly: false,
                    fixedGutter: false,
                    lint: {
                        delay: 800
                    },
                    gutters: ['CodeMirror-lint-markers'],
                    autoRefresh: true,
                    mode: 'sieve'
                };

                let editor = null;

                // write the normalization as a map from a list to the actual value
                // (is easier to add values to - and - the other way around is really hard to read)
                const unicodeClassification = {
                    "'": ['‹', '›', '‚', '‘', '‛', '’', '❛', '❜', '❮', '❯'],
                    '"': ['«', '»', '„', '“', '‟', '”', '❝', '❞', '〝', '〞', '〟', '＂']
                };

                // regex map because this is the best way to replaceAll (replace only replaces one value)
                const regexMap = _.mapValues(
                    unicodeClassification,
                    (value) => new RegExp('[' + value.join('') + ']', 'g')
                );

                scope.codeMirrorLoaded = (codemirror) => {
                    editor = codemirror;

                    editor.on('change', () => {
                        const value = editor.getValue();

                        if (_.values(regexMap).some((regex) => regex.exec(value))) {
                            const sanitizedValue = _.reduce(
                                _.keys(regexMap),
                                (interValue, ascii) => interValue.replace(regexMap[ascii], ascii),
                                value
                            );

                            // keep the cursor at the right position
                            const cursor = editor.getCursor();
                            editor.setValue(sanitizedValue);
                            editor.setCursor(cursor);
                        }
                    });
                };

                const focusCodeMirror = () => {
                    if (editor !== null) {
                        editor.focus();
                    }
                };

                // The label is only visible after a delay
                const sieveLabel = elem.find('label');
                sieveLabel.on('click.focusSieve', focusCodeMirror);
                unsubscribe.push(() => sieveLabel.off('click.focusSieve'));

                scope.$on('$destroy', () => {
                    _.each(unsubscribe, (cb) => cb());
                    unsubscribe.length = 0;
                });
            }
        }
    };
}
export default sieveLabelInput;
