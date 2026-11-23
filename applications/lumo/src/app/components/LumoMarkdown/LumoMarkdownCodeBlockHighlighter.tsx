// Sync Prism build: stable default export (PrismAsync default was undefined under some split-chunk + interop cases).
import PrismHighlighter from 'react-syntax-highlighter/dist/esm/prism';

import type { ThemeTypes } from '@proton/shared/lib/themes/constants';

import './LumoMarkdownCodeBlockHighlighter.scss';

export interface LumoMarkdownCodeBlockHighlighterProps {
    code: string;
    language: string;
    theme: ThemeTypes;
    className?: string;
}

/**
 * Loaded via React.lazy() from `LumoMarkdownCodeBlock` so the syntax-highlighter chunk loads on demand.
 */
export default function LumoMarkdownCodeBlockHighlighter({
    code,
    language,
    className = 'lumo-bg-artifact-code-bg',
}: LumoMarkdownCodeBlockHighlighterProps) {
    return (
        <PrismHighlighter
            language={language}
            useInlineStyles={false}
            style={{}}
            PreTag="div"
            className={`lumo-syntax-highlighter p-4 lumo-font-mono lumo-color-glyph ${className}`}
        >
            {code}
        </PrismHighlighter>
    );
}
