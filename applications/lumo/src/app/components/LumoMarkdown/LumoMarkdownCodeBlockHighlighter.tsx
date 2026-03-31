import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { ThemeTypes } from '@proton/shared/lib/themes/constants';

// Sync Prism build: stable default export (PrismAsync default was undefined under some split-chunk + interop cases).
import PrismHighlighter from 'react-syntax-highlighter/dist/esm/prism';

export interface LumoMarkdownCodeBlockHighlighterProps {
    code: string;
    language: string;
    theme: ThemeTypes;
}

/**
 * Loaded via React.lazy() from `LumoMarkdownCodeBlock` so the syntax-highlighter chunk loads on demand.
 */
export default function LumoMarkdownCodeBlockHighlighter({
    code,
    language,
    theme,
}: LumoMarkdownCodeBlockHighlighterProps) {
    return (
        <PrismHighlighter
            language={language}
            style={theme === ThemeTypes.LumoDark ? oneDark : oneLight}
            wrapLongLines={true}
            PreTag="div"
        >
            {code}
        </PrismHighlighter>
    );
}
