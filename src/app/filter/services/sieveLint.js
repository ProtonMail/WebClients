import { FILTER_VERSION } from '../../constants';

/* @ngInject */
function sieveLint(Filter) {
    let wasValid = true;

    /**
     * Uses the protonmail API to find errors in the sieve code.
     */
    function register() {
        window.CodeMirror.registerHelper('lint', 'sieve', (text) => {
            if (text.trim() === '') {
                const line = text.split('\n')[0];
                return [
                    {
                        message: 'A sieve script cannot be empty',
                        severity: 'error',
                        from: window.CodeMirror.Pos(0, 0),
                        to: window.CodeMirror.Pos(0, line.length)
                    }
                ];
            }

            return Filter.check({
                Version: FILTER_VERSION,
                Sieve: text
            }).then((response) => {
                if (response.status !== 200) {
                    return [];
                }
                wasValid = response.data.Issues.length === 0;
                return response.data.Issues;
            });
        });
    }

    function lastCheckWasValid() {
        return wasValid;
    }

    function resetLastCheck() {
        wasValid = true;
    }

    return { init: register, lastCheckWasValid, resetLastCheck };
}
export default sieveLint;
