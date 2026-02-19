import React, { useMemo } from 'react';

import type { SearchItem } from '../../../../../lib/toolCall/types';
import {
    isToolResultError,
    isWebSearchToolCallData,
    isWebSearchToolResultData,
    tryParseToolCall,
    tryParseToolResult,
} from '../../../../../lib/toolCall/types';
import SourceLink from '../../../../components/SourceLink/SourceLink';
import { decodeHtml } from './helpers';

export type ToolCallInfoProps = {
    toolCall: string | undefined;
    toolResult: string | undefined;
    handleLinkClick: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
};

export const ToolCallInfo = ({ toolCall, toolResult, handleLinkClick }: ToolCallInfoProps) => {
    // Parse tool call and tool result directly
    const parsedToolCall = toolCall ? tryParseToolCall(toolCall) : null;
    const parsedToolResult = toolResult ? tryParseToolResult(toolResult) : null;

    const query = parsedToolCall && isWebSearchToolCallData(parsedToolCall) ? parsedToolCall.arguments.query : null;
    const hasError = parsedToolResult ? isToolResultError(parsedToolResult) : false;
    const results: SearchItem[] | null =
        parsedToolResult && isWebSearchToolResultData(parsedToolResult) ? parsedToolResult.results : null;
    const errorMessage =
        hasError && parsedToolCall && isWebSearchToolCallData(parsedToolCall)
            ? `Error while searching for: ${parsedToolCall.arguments.query}`
            : undefined;

    const cleanedResults = useMemo(() => {
        return (
            results?.map((result) => ({
                ...result,
                title: decodeHtml(result.title),
                description: result.description ? decodeHtml(result.description) : undefined,
                extra_snippets: result.extra_snippets?.map(decodeHtml),
            })) ?? null
        );
    }, [results]);

    if (!query || !cleanedResults) {
        return null;
    }

    if (hasError) {
        return <div className="text-bold color-danger">{errorMessage}</div>;
    }

    return (
        <ul className="unstyled w-full flex flex-column flex-nowrap gap-2 group">
            {cleanedResults.map((result, index) => {
                return (
                    <li className="w-full rounded shrink-0" data-source-index={index} key={result.url}>
                        <SourceLink key={`${result.url}-${index}`} result={result} handleLinkClick={handleLinkClick} />
                    </li>
                );
            })}
        </ul>
    );
};
