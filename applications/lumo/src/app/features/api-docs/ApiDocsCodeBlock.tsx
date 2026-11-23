import { useCallback, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import type { CodeLang } from './lumoApiDocs.config';

import './ApiDocsCodeBlock.scss';

const LANG_ORDER: CodeLang[] = ['curl', 'python', 'typescript', 'rust'];

const LANG_LABEL: Record<CodeLang, string> = {
    curl: 'cURL',
    python: 'Python',
    typescript: 'TypeScript',
    rust: 'Rust',
};

interface ApiDocsCodeBlockProps {
    codeByLang: Record<CodeLang, string>;
    /** Syntax highlighter key passed to CSS (curl | python | typescript | rust) */
    initialLang?: CodeLang;
}

export const ApiDocsCodeBlock = ({ codeByLang, initialLang = 'curl' }: ApiDocsCodeBlockProps) => {
    const [lang, setLang] = useState<CodeLang>(initialLang);
    const [copied, setCopied] = useState(false);

    const code = codeByLang[lang] ?? '';

    const handleCopy = useCallback(() => {
        void navigator.clipboard.writeText(code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    }, [code]);

    return (
        <div className="api-docs-code-block">
            <div className="flex flex-wrap items-start justify-space-between gap-2 mb-2">
                <div className="flex flex-wrap gap-1">
                    {LANG_ORDER.map((l) => (
                        <Button
                            key={l}
                            shape="ghost"
                            size="small"
                            className={lang === l ? 'api-docs-code-block-lang-active' : ''}
                            onClick={() => setLang(l)}
                            type="button"
                        >
                            {LANG_LABEL[l]}
                        </Button>
                    ))}
                </div>
                <Button shape="outline" size="small" onClick={handleCopy} type="button">
                    {copied ? c('Action').t`Copied` : c('Action').t`Copy`}
                </Button>
            </div>
            <div className="overflow-hidden radius-8">
                <pre
                    className={`api-docs-code-block-pre lumo-body-small lumo-bg-panel-inverse m-0 py-4 px-5 lumo-color-glyph-inverse lumo-font-mono api-docs-code-block-pre-${lang}`}
                >
                    <code>{code}</code>
                </pre>
            </div>
        </div>
    );
};
