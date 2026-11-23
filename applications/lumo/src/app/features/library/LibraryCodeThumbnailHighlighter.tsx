// Same sync Prism build as LumoMarkdownCodeBlockHighlighter, so both share one lazy chunk.
import PrismHighlighter from 'react-syntax-highlighter/dist/esm/prism';

import type { ThemeTypes } from '@proton/shared/lib/themes/constants';

import '../../components/LumoMarkdown/LumoMarkdownCodeBlockHighlighter.scss';

export interface LibraryCodeThumbnailHighlighterProps {
    code: string;
    language: string;
    theme: ThemeTypes;
}

/**
 * Loaded via React.lazy() from LibraryCreationThumbnail. Renders React elements (no innerHTML), so
 * the code is escaped like any other text. Sizing and font come from the card, not the Prism theme.
 */
export default function LibraryCodeThumbnailHighlighter({ code, language }: LibraryCodeThumbnailHighlighterProps) {
    return (
        <PrismHighlighter
            language={language}
            style={{}}
            useInlineStyles={false}
            className="lumo-syntax-highlighter lumo-color-glyph"
            PreTag="div"
            showLineNumbers
            lineNumberStyle={{
                minInlineSize: '1.25rem',
                paddingInlineEnd: '1rem',
                color: 'var(--lumo-artifact-syntax-line-number)',
            }}
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
