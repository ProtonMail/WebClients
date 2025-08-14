import React, { useMemo } from 'react';

import SourceLink from '../../../../components/SourceLink/SourceLink';
import { decodeHtml } from './helpers';
import { useToolCallInfo } from './useToolCallInfo';

export type ToolCallInfoProps = {
    toolCall: string | undefined;
    toolResult: string | undefined;
    handleLinkClick: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
};

export const ToolCallInfo = ({ toolCall, toolResult, handleLinkClick }: ToolCallInfoProps) => {
    const { query, hasError, results, errorMessage } = useToolCallInfo(toolCall, toolResult);

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
