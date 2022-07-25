import { useEffect, useRef } from 'react';
import { Controlled as CodeMirror } from 'react-codemirror2';

import { Editor, EditorChange, EditorConfiguration } from 'codemirror';
import { Annotation, Linter } from 'codemirror/addon/lint/lint';
import 'codemirror/addon/lint/lint';
import 'codemirror/mode/sieve/sieve';

import { normalize } from '../../utils';

import './SieveEditor.scss';
import 'codemirror/addon/lint/lint.css';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/base16-dark.css';

interface Props {
    value: string;
    issues?: Annotation[];
    onChange: (editor: Editor, data: EditorChange, value: string) => void;
    theme?: string;
}

let uglyGlobalLintRef: ((content: string) => Annotation[]) | undefined;

const clean = normalize();

const customLint: Linter<{}> = (content = '') => {
    const lint = uglyGlobalLintRef;

    return lint ? lint(clean(content)) : [];
};

const SieveEditor = ({ value, issues = [], onChange, theme }: Props) => {
    const editorRef = useRef<Editor>();
    const options: EditorConfiguration = {
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

    useEffect(() => {
        /**
         * Autorefresh addon does not fix the initial rendering issue correctly
         * cf. https://codemirror.net/5/doc/manual.html#addon_autorefresh
         *
         * We need to manually trigger it manually
         */
        const timeoutId = setTimeout(() => {
            editorRef.current?.refresh();
        }, 500);

        return () => {
            clearTimeout(timeoutId);
        };
    }, []);

    return (
        <CodeMirror
            className="border mt1"
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
