import { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownModalProps {
    isOpen: boolean;
    onClose: () => void;
    markdownContent: string;
}

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
                    <ReactMarkdown
                        components={{
                            // @ts-ignore
                            code({ node, inline, className, children, ...props }) {
                                const match = /language-(\w+)/.exec(className || '');
                                return !inline && match ? (
                                    // @ts-ignore
                                    <SyntaxHighlighter
                                        language={match[1]}
                                        // @ts-ignore
                                        style={oneLight}
                                        PreTag="div"
                                        {...props}
                                    >
                                        {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                ) : (
                                    <code className={className} {...props}>
                                        {children}
                                    </code>
                                );
                            },
                        }}
                    >
                        {markdownContent}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
    );
};
