angular.module('proton.filter')
    .directive('sieveLabelInput', () => {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: 'templates/filter/sieveLabelInput.tpl.html',
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
                    scope.codeMirrorLoaded = (codemirror) => {
                        editor = codemirror;
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
    });
