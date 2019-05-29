import React, { useEffect } from 'react';
import codemirror from 'codemirror';
import PropTypes from 'prop-types';
import { UnControlled as CodeMirror } from 'react-codemirror2';
import { useApi } from 'react-components';
import { noop, debounce } from 'proton-shared/lib/helpers/function';
import { normalize } from 'proton-shared/lib/filters/sieve';
import { FILTER_VERSION } from 'proton-shared/lib/constants';
import { checkSieveFilter } from 'proton-shared/lib/api/filters';

import 'codemirror/addon/display/autorefresh';
import 'codemirror/addon/lint/lint';
import 'codemirror/mode/sieve/sieve';
import 'codemirror/lib/codemirror.css';
import 'codemirror/addon/lint/lint.css';

const clean = normalize();
codemirror.registerHelper(
    'lint',
    'sieve',
    debounce((text) => {
        if (text.trim() === '') {
            const [line = ''] = text.split('\n');
            return [
                {
                    message: 'A sieve script cannot be empty',
                    severity: 'error',
                    from: codemirror.Pos(0, 0),
                    to: codemirror.Pos(0, line.length)
                }
            ];
        }

        const lint = codemirror._uglyGlobal;
        return lint ? lint(clean(text)) : [];
    }, 500)
);

function FilterEditorSieve({ filter, onChangeBeforeLint, onChange }) {
    const api = useApi();

    useEffect(() => {
        /*
            Cheat to avoid broken context with react lifecycle as we can't
            unregister the hook and we need to have the right API for the hook
         */
        codemirror._uglyGlobal = async (text, Version = FILTER_VERSION) => {
            const data = await api(checkSieveFilter({ Version, Sieve: text }));
            const list = data.Issues || [];
            onChange(!!list.length, text);
            return list;
        };

        return () => {
            delete codemirror._uglyGlobal;
        };
    }, []);

    const handleChange = (editor, opt, input) => {
        onChangeBeforeLint(clean(input));
    };

    return (
        <CodeMirror
            value={filter.Sieve}
            options={{
                mode: 'sieve',
                lineNumbers: true,
                lineWrapping: true,
                readOnly: false,
                fixedGutter: false,
                spellcheck: false,
                lint: {
                    delay: 800
                },
                gutters: ['CodeMirror-lint-markers'],
                autoRefresh: true
            }}
            onChange={handleChange}
        />
    );
}

FilterEditorSieve.propTypes = {
    filter: PropTypes.object.isRequired,
    onChangeBeforeLint: PropTypes.func,
    onChange: PropTypes.func
};

FilterEditorSieve.defaultProps = {
    onChangeBeforeLint: noop,
    onChange: noop
};

export default FilterEditorSieve;
