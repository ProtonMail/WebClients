import React, { useEffect, useRef } from 'react';
import codemirror, { Annotation, Linter } from 'codemirror';
import { Controlled as CodeMirror } from 'react-codemirror2';
import { normalize } from '../../utils';

import 'codemirror/addon/display/autorefresh';
import 'codemirror/addon/lint/lint';
import 'codemirror/mode/sieve/sieve';
import 'codemirror/lib/codemirror.css';
import 'codemirror/addon/lint/lint.css';
import 'codemirror/theme/base16-dark.css';

import './SieveEditor.scss';

interface Props {
    value: string;
    issues?: Annotation[];
    onChange: (editor: codemirror.Editor, data: codemirror.EditorChange, value: string) => void;
    theme?: string;
}

let uglyGlobalLintRef: ((content: string) => Annotation[]) | undefined;

const clean = normalize();

const customLint: Linter = (content = '') => {
    const lint = uglyGlobalLintRef;

    return lint ? lint(clean(content)) : [];
};

const SieveEditor = ({ value, issues = [], onChange, theme }: Props) => {
    const editorRef = useRef<codemirror.Editor>();
    const options: codemirror.EditorConfiguration = {
        mode: 'sieve',
        lineNumbers: true,
        lineWrapping: true,
        readOnly: false,
        fixedGutter: false,
        gutters: ['CodeMirror-lint-markers'],
        lint: {
            getAnnotations: customLint,
        },
        ...(theme ? { theme } : {}),
    };

    useEffect(() => {
        /*
            Ugly hack to avoid broken context with react lifecycle as we can't
            unregister the hook and we need to have the right API for the hook
         */
        uglyGlobalLintRef = () => issues;

        return () => {
            uglyGlobalLintRef = undefined;
        };
    }, [issues]);

    return (
        <CodeMirror
            className="bordered"
            value={value}
            options={options}
            onBeforeChange={onChange}
            editorDidMount={(editor) => {
                editorRef.current = editor;
            }}
        />
    );
};

export default SieveEditor;
