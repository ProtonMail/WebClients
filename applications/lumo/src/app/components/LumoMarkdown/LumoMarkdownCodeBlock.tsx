import { Suspense, lazy, useRef } from 'react';

import { clsx } from 'clsx';

import { useCopyNotification } from '../../hooks/useCopyNotification';
import { useIsLumoSmallScreen } from '../../hooks/useIsLumoSmallScreen';
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
 * Copy overlays the top-right corner (no extra right padding) and sticks while the block scrolls.
 */
export const LumoMarkdownCodeBlock = ({ code, language }: LumoMarkdownCodeBlockProps) => {
    const { theme } = useLumoTheme();
    const { isSmallScreen } = useIsLumoSmallScreen();
    const codeBlockCopyRef = useRef<HTMLDivElement>(null);
    const { showCopyNotification } = useCopyNotification();

    const copyButtonClassName = clsx(
        'lumo-code-block-copy lumo-no-copy shadow-lifted',
        !isSmallScreen && 'group-hover:opacity-100'
    );

    return (
        <div className="message-container code-container w-full min-w-0">
            <div className="group-hover-opacity-container lumo-code-block">
                <Suspense
                    fallback={
                        <>
                            <pre className="lumo-code-block-fallback text-monospace text-sm m-0 p-4 rounded-lg bg-weak">
                                {code}
                            </pre>
                            <div className={copyButtonClassName}>
                                <LumoCopyButton
                                    textToCopy={code}
                                    containerRef={codeBlockCopyRef}
                                    onSuccess={showCopyNotification}
                                />
                            </div>
                        </>
                    }
                >
                    <div ref={codeBlockCopyRef} className="lumo-code-block-copy-source min-w-0">
                        <LumoMarkdownCodeBlockHighlighter code={code} language={language} theme={theme} />
                    </div>
                    <div className={copyButtonClassName}>
                        <LumoCopyButton
                            textToCopy={code}
                            containerRef={codeBlockCopyRef}
                            onSuccess={showCopyNotification}
                        />
                    </div>
                </Suspense>
            </div>
        </div>
    );
};
