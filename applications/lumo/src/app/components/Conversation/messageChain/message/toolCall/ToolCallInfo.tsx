import React, { useMemo } from 'react';

import type { SearchItem } from '../../../../../lib/toolCall/types';
import SourceLink from '../../../../SourceLink/SourceLink';
import { decodeHtml } from './helpers';

export type ToolCallInfoProps = {
    results: SearchItem[];
    handleLinkClick: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
};

export const ToolCallInfo = ({ results, handleLinkClick }: ToolCallInfoProps) => {
    const cleanedResults = useMemo(() => {
        return results.map((result) => ({
            ...result,
            title: decodeHtml(result.title),
            description: result.description ? decodeHtml(result.description) : undefined,
            extra_snippets: result.extra_snippets?.map(decodeHtml),
        }));
    }, [results]);

    if (cleanedResults.length === 0) {
        return null;
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
