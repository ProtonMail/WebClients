import { lazy, Suspense, useRef } from 'react';

import { useCopyNotification } from '../../hooks/useCopyNotification';
import { useLumoTheme } from '../../providers';
import LumoCopyButton from '../Conversation/messageChain/message/actionToolbar/LumoCopyButton';

const LumoMarkdownCodeBlockHighlighter = lazy(() => import('./LumoMarkdownCodeBlockHighlighter'));

export interface LumoMarkdownCodeBlockProps {
    /** Source text */
    code: string;
    /** Prism language id (e.g. `python`, `typescript`, `rust`, `plaintext`) */
    language: string;
}

/**
 * Code block matching chat / markdown rendering: Prism highlighting + copy control.
 * Inner highlighter is lazy-loaded so the syntax-highlighter vendor chunk loads on first code block.
 *
 * Copy uses plain text (appropriate for code) and a solid label button so the control stays visible on
 * all Prism themes — icon-only ghost controls were easy to lose on dark syntax backgrounds / overlays.
 */
export const LumoMarkdownCodeBlock = ({ code, language }: LumoMarkdownCodeBlockProps) => {
    const { theme } = useLumoTheme();
    const codeBlockRef = useRef<HTMLDivElement>(null);
    const { showCopyNotification } = useCopyNotification();

    return (
        <div ref={codeBlockRef} className="message-container code-container w-full min-w-0 bg-weak">
            {/* `relative` establishes the panel box; copy is absolutely top-right inside it (not grid — overlapping grid items can auto-flow to the next row in some cases). */}
            <div className="relative w-full min-w-0 overflow-visible">
                <div className="min-w-0 pr-12 pt-1">
                    <Suspense
                        fallback={
                            <pre className="text-monospace text-sm m-0 p-4 rounded-lg bg-weak overflow-auto">
                                {code}
                            </pre>
                        }
                    >
                        <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }} className="lumo-no-copy pointer-events-auto relative z-50 p-0.5">
                            <LumoCopyButton containerRef={codeBlockRef} onSuccess={showCopyNotification} />
                        </div>
                        <LumoMarkdownCodeBlockHighlighter code={code} language={language} theme={theme} />
                    </Suspense>
                </div>

            </div>
        </div>
    );
};
