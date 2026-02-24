import React, { Suspense, lazy, useEffect } from 'react';
import type { Components } from 'react-markdown';

// Lazy load markdown rendering to avoid loading heavy markdown packages in initial bundle
const ReactMarkdown = lazy(() => import('react-markdown'));

// Lazy load syntax highlighter components
const SyntaxHighlighter = lazy(async () => {
    const { SyntaxHighlighter: SH } = await import('../LumoMarkdown/syntaxHighlighterConfig');
    return { default: SH };
});

// Lazy load styles
const getOneLight = () => import('react-syntax-highlighter/dist/esm/styles/prism').then((m) => m.oneLight);

interface MarkdownModalProps {
    isOpen: boolean;
    onClose: () => void;
    markdownContent: string;
}

const MarkdownContent: React.FC<{ markdownContent: string }> = ({ markdownContent }) => {
    const [style, setStyle] = React.useState<any>(null);

    React.useEffect(() => {
        void getOneLight().then(setStyle);
    }, []);

    const components = React.useMemo<Components>(
        () => ({
            code: ({ node, inline, className, children, ...props }: any) => {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                    <Suspense fallback={<pre>{String(children)}</pre>}>
                        <SyntaxHighlighter language={match[1]} style={style} PreTag="div" {...props}>
                            {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                    </Suspense>
                ) : (
                    <code className={className} {...props}>
                        {children}
                    </code>
                );
            },
        }),
        [style]
    );

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ReactMarkdown components={components}>{markdownContent}</ReactMarkdown>
        </Suspense>
    );
};

export const MarkdownModal = ({ isOpen, onClose, markdownContent }: MarkdownModalProps) => {
    useEffect(() => {
        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscapeKey);
        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
                <div className="flex justify-end">
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        ×
                    </button>
                </div>
                <div className="prose overflow-scroll max-h-[1024px]">
                    <MarkdownContent markdownContent={markdownContent} />
                </div>
            </div>
        </div>
    );
};
