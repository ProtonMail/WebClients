import React, { useEffect, useRef } from 'react';
import codemirror from 'codemirror';
import { Controlled as CodeMirror } from 'react-codemirror2';
import { normalize } from 'proton-shared/lib/filters/sieve';
import { SieveIssue } from 'proton-shared/lib/filters/interfaces';
import 'codemirror/addon/display/autorefresh';
import 'codemirror/addon/lint/lint';
import 'codemirror/mode/sieve/sieve';
import 'codemirror/lib/codemirror.css';
import 'codemirror/addon/lint/lint.css';
import 'codemirror/theme/base16-dark.css';

interface Props {
    value: string;
    issues?: SieveIssue[];
    onChange: (editor: codemirror.Editor, data: codemirror.EditorChange, value: string) => void;
    theme?: string;
}

const clean = normalize();

let uglyGlobal: ((text: string) => SieveIssue[]) | undefined;

const lint = (text = '') => {
    const lint = uglyGlobal;
    return lint ? lint(clean(text)) : [];
};

if (typeof window !== 'undefined') {
    codemirror.registerHelper('lint', 'sieve', lint);
}

const SieveEditor = ({ value, issues = [], onChange, theme }: Props) => {
    const editorRef = useRef<codemirror.Editor>();
    const options: codemirror.EditorConfiguration = {
        mode: 'sieve',
        lineNumbers: true,
        lineWrapping: true,
        readOnly: false,
        fixedGutter: false,
        gutters: ['CodeMirror-lint-markers'],
        ...(theme ? { theme } : {})
    };

    useEffect(() => {
        /*
            Ugly hack to avoid broken context with react lifecycle as we can't
            unregister the hook and we need to have the right API for the hook
         */
        uglyGlobal = () => issues;

        return () => {
            uglyGlobal = undefined;
        };
    }, [issues]);

    return (
        <CodeMirror
            className="bordered-container"
            value={value}
            options={options}
            onBeforeChange={onChange}
            editorDidMount={(editor) => (editorRef.current = editor)}
        />
    );
};

export default SieveEditor;
