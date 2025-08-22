import React, { useMemo } from 'react';
import Markdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

import remarkGfm from 'remark-gfm';

import './LumoMarkdown.scss';

import { ButtonLike } from '@proton/atoms';
import { Copy } from '@proton/components';

import type { SearchItem } from '../../../lib/toolCall/types';
import type { Message } from '../../../types';
import { parseInteger } from '../../../util/number';
import { convertRefTokensToSpans } from '../../../util/tokens';
import { getDomain } from '../../interactiveConversation/messageChain/message/toolCall/helpers';

const RefLink = React.memo(
    ({
        id,
        children,
        toolCallResults,
        sourcesContainerRef,
        handleLinkClick,
    }: {
        id: string;
        children: React.ReactNode;
        toolCallResults: SearchItem[] | null;
        sourcesContainerRef: React.RefObject<HTMLDivElement>;
        handleLinkClick?: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
    }) => {
        if (!toolCallResults) return null;

        const idInt = parseInteger(id);
        if (!idInt) return null;

        const toolCallInfo = toolCallResults?.[idInt];
        if (!toolCallInfo) return null;

        const url = toolCallInfo?.url;
        if (!url) return null;

        const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
            if (handleLinkClick) {
                handleLinkClick(e, toolCallInfo?.url ?? '');
            }
        };

        const handleMouseEnter = () => {
            if (sourcesContainerRef.current) {
                const sourceElement = sourcesContainerRef.current.querySelector(`[data-source-index="${id}"]`);
                if (sourceElement) {
                    sourceElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    sourceElement.classList.add('highlight-source');
                }
            }
        };

        const handleMouseLeave = () => {
            if (sourcesContainerRef.current) {
                const sourceElement = sourcesContainerRef.current.querySelector(`[data-source-index="${id}"]`);
                if (sourceElement) {
                    sourceElement.classList.remove('highlight-source');
                }
            }
        };

        return (
            <ButtonLike
                pill
                size="small"
                color="weak"
                shape="solid"
                as="a"
                className="ref-link text-sm mx-1 py-0.5 px-1 lh100"
                href={url}
                onClick={handleClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                target="_blank"
                rel="noopener noreferrer"
            >
                {getDomain(toolCallInfo)}
            </ButtonLike>
        );
    }
);

// Memoized code block component for better performance
const CodeBlock = React.memo(
    ({ language, value, onCopy }: { language: string; value: string; onCopy?: () => void }) => {
        // For very large code blocks, use optimization settings to prevent UI lag
        const isLargeCodeBlock = value.length > 3000;

        // Performance optimization options
        const highlighterOptions = useMemo(
            () => ({
                style: oneLight,
                customStyle: { margin: 0, padding: 0 },
                codeTagProps: {
                    style: {
                        fontFamily: "'SF Mono', Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
                        fontSize: '0.98em',
                        wordBreak: 'break-all',
                    },
                },
                // These options significantly improve performance for large code blocks
                showLineNumbers: false,
                wrapLines: !isLargeCodeBlock,
                wrapLongLines: true,
                PreTag: 'div' as keyof JSX.IntrinsicElements,
                // Added for large code blocks to prevent browser hanging
                ...(isLargeCodeBlock && {
                    lineProps: { style: { whiteSpace: 'pre' } },
                }),
            }),
            [isLargeCodeBlock]
        );

        return (
            <div className="message-container code-container flex flex-row flex-nowrap relative">
                <div className="flex-auto pr-4">
                    <SyntaxHighlighter language={language} children={value} {...highlighterOptions} />
                </div>
                <div className="lumo-no-copy flex-none z-10" style={{ translate: '4px -4px' }}>
                    <Copy
                        shape="ghost"
                        size="small"
                        value={value}
                        onCopy={onCopy}
                        className="button button-for-icon button-small button-ghost-weak sticky"
                        style={{ top: '8px', right: 0 }}
                    />
                </div>
            </div>
        );
    },
    (prevProps, nextProps) => {
        // Deep comparison to prevent unnecessary re-renders
        return prevProps.language === nextProps.language && prevProps.value === nextProps.value;
    }
);

// Memoization is important here.
// It has been observed that the UI can become sluggish
// when a conversation has many long messages.
/* eslint-disable react/display-name */
const LumoMarkdown = React.memo(
    ({
        message,
        content,
        onCopy,
        handleLinkClick,
        toolCallResults,
        sourcesContainerRef,
    }: {
        message: Message;
        content: string | undefined;
        onCopy?: () => void;
        handleLinkClick?: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
        toolCallResults?: SearchItem[] | null;
        sourcesContainerRef?: React.RefObject<HTMLDivElement>;
    }) => {
        // Process REF tokens and convert to links
        const processedContent = useMemo(() => convertRefTokensToSpans(content ?? ''), [content]);

        // Create component renderers
        const renderers = useMemo(
            () => ({
                code(props: any) {
                    const { children, className, ...rest } = props;
                    const match = /language-(\w+)/.exec(className || '');
                    const childrenString = String(children).replace(/\n$/, '');
                    const isMultilineBlock = match || childrenString.trim().includes('\n');

                    if (!isMultilineBlock) {
                        return (
                            <code {...rest} className={className}>
                                {children}
                            </code>
                        );
                    }

                    return <CodeBlock language={match?.[1] ?? 'plaintext'} value={childrenString} onCopy={onCopy} />;
                },
                img() {
                    return null; // security
                },
                table(props: any) {
                    return (
                        <div className="markdown-table-wrapper">
                            <table {...props} />
                        </div>
                    );
                },
                a(props: any) {
                    const { href, children } = props;

                    // Handle REF links
                    if (href?.startsWith('#ref-')) {
                        const id = href.substring(5); // Remove '#ref-' prefix
                        return (
                            <RefLink
                                id={id}
                                toolCallResults={toolCallResults ?? null}
                                sourcesContainerRef={sourcesContainerRef ?? { current: null }}
                                handleLinkClick={handleLinkClick}
                            >
                                {children}
                            </RefLink>
                        );
                    }

                    // Handle regular links
                    if (!handleLinkClick || !href) {
                        return href;
                    }

                    return (
                        <a href={href} onClick={(e) => handleLinkClick(e, href)}>
                            {children}
                        </a>
                    );
                },
            }),
            [onCopy, handleLinkClick, toolCallResults, sourcesContainerRef]
        );

        return (
            <Markdown
                remarkPlugins={[remarkGfm]}
                skipHtml={true} // security
                components={renderers}
            >
                {processedContent}
            </Markdown>
        );
    }
);

export default LumoMarkdown;
