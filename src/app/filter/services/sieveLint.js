
/**
 * Uses the protonmail API to find errors in the sieve code.
 */

angular.module('proton.filter')
    .factory('sieveLint', (Filter, CONSTANTS) => {

        function register() {
            window.CodeMirror.registerHelper('lint', 'sieve', (text) => {
                if (text.trim() === '') {
                    const line = text.split('\n')[0];
                    return [{ message: 'A sieve script cannot be empty',
                        severity: 'error',
                        from: window.CodeMirror.Pos(0, 0),
                        to: window.CodeMirror.Pos(0, line.length) }];
                }

                return Filter.check({
                    Version: CONSTANTS.FILTER_VERSION,
                    Sieve: text
                }).then((response) => {
                    if (response.status !== 200) {
                        return [];
                    }
                    return response.data.Issues;
                });
            });
        }


        return { init: register };
    });
