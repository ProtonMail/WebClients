import React, { Suspense, lazy, useEffect, useMemo } from 'react';
import Markdown from 'react-markdown';

import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { visit } from 'unist-util-visit';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { isIos, isIpad, isSafari } from '@proton/shared/lib/helpers/browser';

import type { SearchItem } from '../../lib/toolCall/types';
import { parseInteger } from '../../util/number';
import { convertRefTokensToSpans, normalizeBrTags } from '../../util/tokens';
import { getDomain } from '../Conversation/messageChain/message/toolCall/helpers';
import { InlineImageComponent } from './InlineImageComponent';
import { LumoMarkdownCodeBlock } from './LumoMarkdownCodeBlock';
import { LumoMarkdownCardBlock } from './card/LumoMarkdownCardBlock';
import { LumoMetricCardRow } from './card/LumoMetricCardRow';
import { buildMarkdownRenderUnits } from './card/coalesceMetricCardBlocks';
import {
    isCardRowLanguage,
    looksLikeMetricCardPartial,
    shouldRenderAsCard,
    splitAroundOpenCardCodeFence,
} from './card/detectCardSpec';
import { parseCardRowFence, parseCardRowSegmentCode } from './card/parseCardRowFence';
import { tryParseCardSpec } from './card/parseCardSpec';
import { renderCardAwareSegment } from './card/renderCardSegments';
import { LUMO_MARKDOWN_CARD_SHELL_CLASS, TRAILING_VEGA_CHART_KEY } from './lumoMarkdownCardShell';
import { normalizeGfmTableSpacing } from './normalizeGfmTableSpacing';
import { remarkLatexDelimiters } from './remarkLatexDelimiters';
import { VegaChartLoading } from './vega/VegaChartLoading';
import { extractCodeBlockText, getCodeBlockLanguage } from './vega/codeBlockUtils';
import { shouldRenderAsVegaChart, splitAroundOpenVegaCodeFence } from './vega/detectVegaSpec';
import {
    blockContainsCompleteCodeFence,
    findCompleteMarkdownCodeFence,
    parseMarkdownCodeFence,
    splitMarkdownWithCompleteCodeFences,
} from './vega/parseMarkdownCodeFence';

import './LumoMarkdown.scss';

const VegaLiteChart = lazy(() => import('./vega/VegaLiteChart').then((module) => ({ default: module.VegaLiteChart })));

/**
 * Remark plugin that converts raw `<br>` HTML nodes into proper AST break nodes.
 * This allows `<br>` tags inside GFM table cells (where block-level lists are
 * unsupported) to render as actual line breaks rather than being stripped.
 */
function remarkBrToBreak() {
    return (tree: any) => {
        visit(tree, 'html', (node: any, index: number | null | undefined, parent: any) => {
            if (parent && typeof index === 'number' && /^<br\s*\/?>$/i.test((node.value ?? '').trim())) {
                parent.children.splice(index, 1, { type: 'break' });
            }
        });
    };
}

/**
 * Progressive Markdown Renderer
 *
 * Intelligently splits content into "complete" and "incomplete" sections:
 * - Complete sections (closed code blocks, paragraphs) are rendered once and cached
 * - Only the incomplete/streaming section is re-rendered on updates
 *
 * This dramatically reduces re-rendering overhead during streaming:
 * - Instead of re-parsing 10KB of content on every token
 * - We only re-parse the last ~100 bytes (active section)
 */

type HandleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;

interface ContentBlock {
    type: 'complete' | 'incomplete';
    content: string;
    key: string;
}

/**
 * Simple hash function for creating stable keys from content
 */
function simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
}

/**
 * Split content into complete blocks (ready to cache) and incomplete block (still streaming)
 *
 * Detects:
 * - Complete code blocks (```...```)
 * - Complete tables (header + separator + at least one row, followed by \n\n)
 * - Complete paragraphs (text followed by \n\n)
 * - Incomplete section (still streaming)
 *
 * Uses position + content hash for keys so complete blocks stay stable during
 * append-only streaming while remaining unique (identical paragraphs, hash collisions).
 */
function splitIntoBlocks(content: string, isStreaming: boolean): ContentBlock[] {
    if (!content) return [];

    const blocks: ContentBlock[] = [];
    let position = 0;

    const nextBlockKey = (kind: 'code' | 'table' | 'para', blockContent: string) =>
        `${kind}-${blocks.length}-${simpleHash(blockContent)}`;

    // Process content sequentially looking for complete blocks
    while (position < content.length) {
        const remaining = content.substring(position);
        const completeCodeFence = findCompleteMarkdownCodeFence(remaining);
        const hasBlockBoundaryAfterFence =
            completeCodeFence && /^\s*(?:\n\n|\n(?=[^\n\s])|$)/.test(remaining.slice(completeCodeFence.end));

        // 1. Check for complete code block (closing fence before blank line, prose, or EOF)
        if (completeCodeFence?.start === 0 && hasBlockBoundaryAfterFence) {
            const blockContent = remaining.slice(0, completeCodeFence.end);
            blocks.push({
                type: 'complete',
                content: blockContent,
                key: nextBlockKey('code', blockContent),
            });
            position += blockContent.length;
            continue;
        }

        // 2. Check for complete table (header | separator | rows, followed by \n\n or EOF)
        // Table format: |...| (header) \n |---| (separator) \n |...| (rows) \n\n
        const tableMatch = remaining.match(/^(\|[^\n]+\|\n\|[\s:-]+\|\n(?:\|[^\n]+\|\n)+)(\n|$)/);
        if (tableMatch) {
            const tableContent = tableMatch[1];
            const hasDoubleNewline = remaining.substring(tableContent.length).startsWith('\n\n');

            if (hasDoubleNewline || position + tableContent.length >= content.length) {
                // Table is complete (followed by \n\n or at end of content)
                const blockContent = tableContent + '\n\n';
                blocks.push({
                    type: 'complete',
                    content: blockContent,
                    key: nextBlockKey('table', blockContent),
                });
                position += tableContent.length + 2; // +2 for \n\n
                continue;
            }
        }

        // 3. Check for complete paragraph (text followed by \n\n)
        const paraMatch = remaining.match(/^((?:(?!\n\n|```|\|[^\n]+\|).)+)(\n\n)/);
        if (paraMatch) {
            const blockContent = paraMatch[0];
            blocks.push({
                type: 'complete',
                content: blockContent,
                key: nextBlockKey('para', blockContent),
            });
            position += blockContent.length;
            continue;
        }

        // 3b. While streaming, peel complete code fences even when prefixed by unfinished prose.
        if (isStreaming && completeCodeFence && completeCodeFence.start > 0 && hasBlockBoundaryAfterFence) {
            const prefix = remaining.slice(0, completeCodeFence.start);
            if (prefix.trim()) {
                blocks.push({
                    type: 'incomplete',
                    content: prefix,
                    key: `streaming-prefix-${simpleHash(prefix)}`,
                });
            }
            position += completeCodeFence.start;
            continue;
        }

        // 4. Everything else
        // If streaming: mark as incomplete
        // If not streaming: mark as complete (streaming just finished)
        // Use stable 'final' key to avoid remounting when streaming finishes
        blocks.push({
            type: isStreaming ? 'incomplete' : 'complete',
            content: remaining,
            key: isStreaming ? 'streaming' : 'final',
        });
        break;
    }

    return blocks;
}

function SafeLink({
    href,
    handleLinkClick,
    children,
}: {
    href: string;
    handleLinkClick: HandleLinkClick | undefined;
    children?: React.ReactNode;
}) {
    if (!handleLinkClick || !href) {
        return <a href={href}>{children}</a>;
    }

    return (
        <a href={href} onClick={(e) => handleLinkClick(e, href)}>
            {children}
        </a>
    );
}

const RefLink = React.memo(function RefLink({
    id,
    children: _children,
    toolCallResults,
    sourcesContainerRef,
    handleLinkClick,
}: {
    id: string;
    children: React.ReactNode;
    toolCallResults?: SearchItem[] | null;
    sourcesContainerRef?: React.RefObject<HTMLDivElement>;
    handleLinkClick?: HandleLinkClick;
}) {
    useEffect(() => {
        return () => {
            sourcesContainerRef?.current
                ?.querySelector(`[data-source-index="${id}"]`)
                ?.classList.remove('highlight-source');
        };
    }, [id, sourcesContainerRef]);

    if (!toolCallResults) return null;

    const idInt = parseInteger(id);
    if (idInt === null) return null;

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
        const sourceElement = sourcesContainerRef?.current?.querySelector(`[data-source-index="${id}"]`);
        if (sourceElement) {
            sourceElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            sourceElement.classList.add('highlight-source');
        }
    };

    const handleMouseLeave = () => {
        sourcesContainerRef?.current
            ?.querySelector(`[data-source-index="${id}"]`)
            ?.classList.remove('highlight-source');
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
});

interface ProgressiveMarkdownProps {
    content: string;
    isStreaming: boolean;
    handleLinkClick?: HandleLinkClick;
    toolCallResults?: SearchItem[] | null;
    sourcesContainerRef?: React.RefObject<HTMLDivElement>;
    message: any;
    messageContentContainerRef?: React.RefObject<HTMLDivElement>;
}

/**
 * Renders a single markdown block with syntax highlighting
 *
 * Simple approach: Just render everything normally, but cache completed blocks.
 * Progressive rendering ensures only incomplete blocks re-parse on each update.
 */
const MarkdownBlock: React.FC<{
    content: string;
    handleLinkClick?: HandleLinkClick;
    toolCallResults?: SearchItem[] | null;
    sourcesContainerRef?: React.RefObject<HTMLDivElement>;
    message: any;
}> = React.memo(
    ({ content, handleLinkClick, toolCallResults, sourcesContainerRef }) => {
        const CodeBlock = useMemo(() => {
            // eslint-disable-next-line react/display-name
            return ({ node, className, children, ...props }: any) => {
                const language = getCodeBlockLanguage(className, node);
                const value = extractCodeBlockText(children);

                if (shouldRenderAsVegaChart(language, value)) {
                    return (
                        <Suspense fallback={<VegaChartLoading />}>
                            <VegaLiteChart code={value} language={language || 'vega-lite'} />
                        </Suspense>
                    );
                }

                if (shouldRenderAsCard(language, value)) {
                    if (isCardRowLanguage(language)) {
                        const cardRow = parseCardRowSegmentCode(value);
                        if (cardRow && cardRow.length > 0) {
                            return <LumoMetricCardRow cards={cardRow} />;
                        }
                    }

                    const cardSpec = tryParseCardSpec(value);
                    if (cardSpec?.type === 'metric') {
                        return <LumoMetricCardRow cards={[{ code: value, language: language || 'card' }]} />;
                    }

                    return <LumoMarkdownCardBlock code={value} language={language || 'card'} />;
                }

                if (language) {
                    return <LumoMarkdownCodeBlock language={language} code={value} />;
                }

                return (
                    <code className={className} {...props}>
                        {children}
                    </code>
                );
            };
        }, []);

        // Custom components for markdown rendering
        const components = useMemo(
            () => ({
                pre({ children }: { children?: React.ReactNode }) {
                    return <>{children}</>;
                },
                code: CodeBlock,
                a: (props: any) => {
                    const { href, children } = props;

                    // Handle REF links
                    if (href?.startsWith('#ref-')) {
                        const id = href.substring(5);
                        return (
                            <RefLink
                                id={id}
                                toolCallResults={toolCallResults}
                                sourcesContainerRef={sourcesContainerRef}
                                handleLinkClick={handleLinkClick}
                            >
                                {children}
                            </RefLink>
                        );
                    }

                    return (
                        <SafeLink href={href} handleLinkClick={handleLinkClick}>
                            {children}
                        </SafeLink>
                    );
                },
                img: (props: any) => {
                    const { src, alt } = props;

                    // Handle attachment: URLs
                    if (src?.startsWith('attachment:')) {
                        const attachmentId = src.substring('attachment:'.length);
                        // Look up full attachment from Redux (not from message.attachments which is shallow)
                        return <InlineImageComponent attachmentId={attachmentId} alt={alt} />;
                    }

                    // For security, do not render images inline, but allow accessing them via a link
                    const text = alt?.trim() || '[image]';
                    return (
                        <SafeLink href={src} handleLinkClick={handleLinkClick}>
                            {text}
                        </SafeLink>
                    );
                },
                table(props: any) {
                    return (
                        <div className="markdown-table-wrapper">
                            <table {...props} />
                        </div>
                    );
                },
            }),
            [CodeBlock, handleLinkClick, sourcesContainerRef, toolCallResults]
        );

        return (
            <Markdown
                remarkPlugins={[
                    remarkGfm,
                    // singleDollarTextMath is intentionally disabled: single `$` is ambiguous with
                    // currency ($500, $30,000) and shell variables ($HOME, $DEST). Inline math is
                    // handled by remarkLatexDelimiters via \(...\), and display math via \[...\] or $$...$$
                    [remarkMath, { singleDollarTextMath: false }],
                    remarkLatexDelimiters,
                    remarkBrToBreak,
                ]}
                rehypePlugins={[() => rehypeKatex({ output: 'mathml' })]}
                components={components}
                urlTransform={(url) => {
                    // Preserve attachment: URLs, sanitize everything else
                    if (url.startsWith('attachment:')) {
                        return url;
                    }
                    // Default sanitization for other URLs
                    return url;
                }}
            >
                {content}
            </Markdown>
        );
    },
    (prev, next) => {
        // Custom comparison for React.memo
        // Returns TRUE if props are equal (skip re-render)
        // Returns FALSE if props changed (do re-render)

        const contentEqual = prev.content === next.content;

        // For incomplete (streaming) blocks:
        // - content changes on every update → contentEqual = false → shouldSkipRender = false → re-renders ✅
        // For complete blocks:
        // - content stays same → contentEqual = true → shouldSkipRender = true → skips re-render ✅

        return contentEqual;
    }
);

MarkdownBlock.displayName = 'MarkdownBlock';

export const ProgressiveMarkdownRenderer: React.FC<ProgressiveMarkdownProps> = React.memo(
    ({
        content,
        isStreaming,
        handleLinkClick,
        toolCallResults,
        sourcesContainerRef,
        message,
        messageContentContainerRef,
    }) => {
        // Process REF tokens and convert to markdown links
        const processedContent = useMemo(() => {
            const processedContent = convertRefTokensToSpans(content || '');
            return normalizeGfmTableSpacing(normalizeBrTags(processedContent));
        }, [content]);

        // Split content into complete (cacheable) and incomplete (active) blocks
        // Note: Parent component (StreamingMarkdownRenderer) already handles throttling,
        // so we don't need additional debouncing here to avoid double-rendering issues
        const blocks = useMemo(() => {
            return splitIntoBlocks(processedContent, isStreaming);
        }, [processedContent, isStreaming]);

        const renderUnits = useMemo(() => buildMarkdownRenderUnits(blocks), [blocks]);

        const className = useMemo(() => {
            return isIos() || isIpad() || isSafari() ? '' : 'content-visibility-auto';
        }, [isIos(), isIpad(), isSafari()]);
        return (
            <div className="progressive-markdown-content markdown-rendering" ref={messageContentContainerRef}>
                {renderUnits.map((unit, unitIndex) => {
                    const isTrailingUnit = unitIndex === renderUnits.length - 1;
                    if (unit.kind === 'metric-row') {
                        return (
                            <div key={unit.key}>
                                <LumoMetricCardRow cards={unit.cards} pendingSlot={unit.pendingSlot} />
                            </div>
                        );
                    }

                    const block = unit.block;
                    const singleFence = parseMarkdownCodeFence(block.content);
                    const openVegaFence =
                        block.type === 'incomplete' && isStreaming ? splitAroundOpenVegaCodeFence(block.content) : null;

                    const openCardFence =
                        block.type === 'incomplete' && isStreaming ? splitAroundOpenCardCodeFence(block.content) : null;

                    if (openCardFence) {
                        const isMetricStreaming = looksLikeMetricCardPartial(openCardFence.body);

                        if (isMetricStreaming) {
                            if (!openCardFence.prefix.trim()) {
                                return null;
                            }

                            return (
                                <div key={block.key} className={className}>
                                    <MarkdownBlock
                                        content={openCardFence.prefix}
                                        handleLinkClick={handleLinkClick}
                                        toolCallResults={toolCallResults}
                                        sourcesContainerRef={sourcesContainerRef}
                                        message={message}
                                    />
                                </div>
                            );
                        }

                        return (
                            <div key={block.key} className={className}>
                                {openCardFence.prefix.trim() ? (
                                    <MarkdownBlock
                                        content={openCardFence.prefix}
                                        handleLinkClick={handleLinkClick}
                                        toolCallResults={toolCallResults}
                                        sourcesContainerRef={sourcesContainerRef}
                                        message={message}
                                    />
                                ) : null}
                                <div className="lumo-insight-card-block w-full my-2 mb-3">
                                    <div className={`${LUMO_MARKDOWN_CARD_SHELL_CLASS} lumo-insight-card p-4`}>
                                        <div className="lumo-insight-card__label">
                                            <span>Loading card…</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    if (openVegaFence) {
                        const wrapperKey = isTrailingUnit ? TRAILING_VEGA_CHART_KEY : block.key;

                        return (
                            <div key={wrapperKey} className={className}>
                                {openVegaFence.prefix.trim() ? (
                                    <MarkdownBlock
                                        content={openVegaFence.prefix}
                                        handleLinkClick={handleLinkClick}
                                        toolCallResults={toolCallResults}
                                        sourcesContainerRef={sourcesContainerRef}
                                        message={message}
                                    />
                                ) : null}
                                <Suspense fallback={<VegaChartLoading />}>
                                    <VegaLiteChart
                                        code={openVegaFence.body}
                                        language={openVegaFence.language || 'vega-lite'}
                                        deferRender
                                    />
                                </Suspense>
                            </div>
                        );
                    }

                    if (singleFence && shouldRenderAsVegaChart(singleFence.language, singleFence.code)) {
                        const wrapperKey = isTrailingUnit ? TRAILING_VEGA_CHART_KEY : block.key;

                        return (
                            <div key={wrapperKey}>
                                <Suspense fallback={<VegaChartLoading />}>
                                    <VegaLiteChart
                                        code={singleFence.code}
                                        language={singleFence.language || 'vega-lite'}
                                    />
                                </Suspense>
                            </div>
                        );
                    }

                    if (singleFence && shouldRenderAsCard(singleFence.language, singleFence.code)) {
                        const cardRow = parseCardRowFence(block.content);
                        if (cardRow && cardRow.length > 0) {
                            return (
                                <div key={block.key}>
                                    <LumoMetricCardRow cards={cardRow} />
                                </div>
                            );
                        }

                        if (tryParseCardSpec(singleFence.code)?.type === 'metric') {
                            return (
                                <div key={block.key}>
                                    <LumoMetricCardRow
                                        cards={[{ code: singleFence.code, language: singleFence.language || 'card' }]}
                                    />
                                </div>
                            );
                        }

                        return (
                            <div key={block.key}>
                                <LumoMarkdownCardBlock
                                    code={singleFence.code}
                                    language={singleFence.language || 'card'}
                                />
                            </div>
                        );
                    }

                    if (!block.content.trim()) {
                        return null;
                    }

                    if (blockContainsCompleteCodeFence(block.content)) {
                        const segments = splitMarkdownWithCompleteCodeFences(block.content);

                        return (
                            <div key={block.key}>
                                {segments.map((segment, index) => {
                                    if (segment.type === 'markdown') {
                                        if (!segment.content.trim()) {
                                            return null;
                                        }

                                        return (
                                            <MarkdownBlock
                                                key={`md-${index}`}
                                                content={segment.content}
                                                handleLinkClick={handleLinkClick}
                                                toolCallResults={toolCallResults}
                                                sourcesContainerRef={sourcesContainerRef}
                                                message={message}
                                            />
                                        );
                                    }

                                    const renderedSegment = renderCardAwareSegment({
                                        segment,
                                        index,
                                        keyPrefix: block.key,
                                        renderVega: (codeSegment, codeIndex) => (
                                            <Suspense key={`vega-${codeIndex}`} fallback={<VegaChartLoading />}>
                                                <VegaLiteChart
                                                    code={codeSegment.code}
                                                    language={codeSegment.language || 'vega-lite'}
                                                />
                                            </Suspense>
                                        ),
                                        renderCode: (codeSegment, codeIndex) => (
                                            <LumoMarkdownCodeBlock
                                                key={`code-${codeIndex}`}
                                                language={codeSegment.language || 'plaintext'}
                                                code={codeSegment.code}
                                            />
                                        ),
                                    });

                                    return renderedSegment;
                                })}
                            </div>
                        );
                    }

                    return (
                        <div key={block.key} className={className}>
                            <MarkdownBlock
                                content={block.content}
                                handleLinkClick={handleLinkClick}
                                toolCallResults={toolCallResults}
                                sourcesContainerRef={sourcesContainerRef}
                                message={message}
                            />
                        </div>
                    );
                })}
            </div>
        );
    },
    (prevProps, nextProps) => {
        // Only re-render if content changed or streaming state changed
        const contentEqual = prevProps.content === nextProps.content;
        const streamingEqual = prevProps.isStreaming === nextProps.isStreaming;

        return contentEqual && streamingEqual;
    }
);

ProgressiveMarkdownRenderer.displayName = 'ProgressiveMarkdownRenderer';

export default ProgressiveMarkdownRenderer;
