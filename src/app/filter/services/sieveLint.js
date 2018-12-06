import { FILTER_VERSION } from '../../constants';

/* @ngInject */
function sieveLint(Filter) {
    const lint = async (text, Version = FILTER_VERSION) => {
        const { data = {} } = await Filter.check({ Version, Sieve: text });
        return data.Issues || [];
    };

    /**
     * Uses the protonmail API to find errors in the sieve code.
     */
    function init() {
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

            return lint(text);
        });
    }

    return { init, run: lint };
}
export default sieveLint;
