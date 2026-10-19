// Same sync Prism build as LumoMarkdownCodeBlockHighlighter, so both share one lazy chunk.
import PrismHighlighter from 'react-syntax-highlighter/dist/esm/prism';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { ThemeTypes } from '@proton/shared/lib/themes/constants';

export interface LibraryCodeThumbnailHighlighterProps {
    code: string;
    language: string;
    theme: ThemeTypes;
}

/**
 * Loaded via React.lazy() from LibraryCreationThumbnail. Renders React elements (no innerHTML), so
 * the code is escaped like any other text. Sizing and font come from the card, not the Prism theme.
 */
export default function LibraryCodeThumbnailHighlighter({
    code,
    language,
    theme,
}: LibraryCodeThumbnailHighlighterProps) {
    return (
        <PrismHighlighter
            language={language}
            style={theme === ThemeTypes.LumoDark ? oneDark : oneLight}
            PreTag="div"
            showLineNumbers
            lineNumberStyle={{ minWidth: '1.25rem', paddingRight: '1rem', color: 'var(--text-hint)' }}
            customStyle={{
                margin: 0,
                padding: 0,
                background: 'transparent',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                lineHeight: 'inherit',
                overflow: 'hidden',
            }}
            codeTagProps={{ style: { fontFamily: 'inherit', fontSize: 'inherit', background: 'transparent' } }}
        >
            {code}
        </PrismHighlighter>
    );
}
