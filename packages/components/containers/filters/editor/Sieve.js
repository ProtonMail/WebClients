import React, { useEffect, useState, useMemo } from 'react';
import codemirror from 'codemirror';
import PropTypes from 'prop-types';
import { UnControlled as CodeMirror } from 'react-codemirror2';
import { useApi, useMailSettings } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';
import { normalize } from 'proton-shared/lib/filters/sieve';
import { isDarkTheme } from 'proton-shared/lib/themes/helpers';
import { FILTER_VERSION } from 'proton-shared/lib/constants';
import { checkSieveFilter } from 'proton-shared/lib/api/filters';

import 'codemirror/addon/display/autorefresh';
import 'codemirror/addon/lint/lint';
import 'codemirror/mode/sieve/sieve';
import 'codemirror/lib/codemirror.css';
import 'codemirror/addon/lint/lint.css';
import 'codemirror/theme/base16-dark.css';

const clean = normalize();

const lint = (text) => {
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
};

codemirror.registerHelper('lint', 'sieve', lint);

const defaultCodeMirrorOptions = {
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
};

const FilterEditorSieve = ({ filter, onChangeBeforeLint = noop, onChange = noop }) => {
    const api = useApi();
    const [{ Theme }] = useMailSettings();

    const hasDarkTheme = useMemo(() => isDarkTheme(Theme), [Theme]);
    const [value, setValue] = useState(null);

    const options = hasDarkTheme
        ? { ...defaultCodeMirrorOptions, theme: 'base16-dark' }
        : { ...defaultCodeMirrorOptions };

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

        setTimeout(() => setValue(filter.Sieve), 300);

        return () => {
            delete codemirror._uglyGlobal;
        };
    }, []);

    const handleChange = (_editor, _opt, input) => {
        onChangeBeforeLint(clean(input));
    };

    return <CodeMirror className="bordered-container" value={value} options={options} onChange={handleChange} />;
};

FilterEditorSieve.propTypes = {
    filter: PropTypes.object.isRequired,
    onChangeBeforeLint: PropTypes.func,
    onChange: PropTypes.func
};

export default FilterEditorSieve;
