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
            <div className="flex flex-row flex-wrap gap-1 mb-2">
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
            <div className="relative rounded-md overflow-hidden">
                <Button
                    shape="outline"
                    size="small"
                    className="api-docs-code-block-copy absolute z-10"
                    onClick={handleCopy}
                    type="button"
                >
                    {copied ? c('Action').t`Copied` : c('Action').t`Copy`}
                </Button>
                <pre className={`api-docs-code-block-pre text-monospace api-docs-code-block-pre-${lang}`}>
                    <code>{code}</code>
                </pre>
            </div>
        </div>
    );
};
