import React, { useLayoutEffect, useRef, useState } from 'react';

import DOMPurify from 'dompurify';
import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import clsx from '@proton/utils/clsx';

import type { SearchItem } from '../../lib/toolCall/types';

import './SourceLink.scss';
import {getDomain} from "../Conversation/messageChain/message/toolCall/helpers";
import {SourceFavIcon} from "../Conversation/messageChain/message/toolCall/SourcesBlock";

interface SourceLinkProps {
    result: SearchItem;
    handleLinkClick: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
}

const getStrippedHtml = (html: string) => {
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [],
    });
};

// Source descriptions can contain markdown (images, links, emphasis) that would
// otherwise be displayed as raw text and clutter the panel. Strip it down to
// readable plain text.
const cleanSourceText = (text: string): string => {
    return (
        text
            // Markdown images: ![alt](url) -> removed entirely (we don't show images)
            .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
            // Stray/truncated image syntax without a url
            .replace(/!\[[^\]]*\]?/g, '')
            // Markdown links: [text](url) -> text
            .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
            // Emphasis / inline code markers
            .replace(/(\*\*|__|\*|_|`)/g, '')
            // Leading heading / blockquote / list markers per line
            .replace(/^\s*[#>\-*]+\s*/gm, '')
            // Collapse runs of whitespace
            .replace(/\s+/g, ' ')
            .trim()
    );
};

const SourceLink = ({ result, handleLinkClick }: SourceLinkProps) => {
    const domain = getDomain(result);
    const descriptionRef = useRef<HTMLParagraphElement>(null);
    const [expanded, setExpanded] = useState(false);
    const [canExpand, setCanExpand] = useState(false);

    const description = cleanSourceText(getStrippedHtml(result?.description ?? ''));

    useLayoutEffect(() => {
        const el = descriptionRef.current;
        if (el && !expanded) {
            setCanExpand(el.scrollHeight > el.clientHeight + 1);
        }
    }, [description, expanded]);

    if (!domain) {
        return null;
    }

    return (
        <div className="source-link color-norm rounded p-2 w-full flex flex-column flex-nowrap gap-2">
            <Href
                onClick={(e) => handleLinkClick(e, result.url)}
                className="source-link-target color-norm flex flex-column flex-nowrap gap-2"
            >
                <div className="flex flex-row flex-nowrap gap-2 items-center shrink-0">
                    <SourceFavIcon domain={domain} />
                    <span className="text-sm color-weak text-bold w-full text-ellipsis">{domain}</span>
                </div>
                <p className="m-0 text-bold source-clamp source-clamp-2 hover:text-underline">{result.title}</p>
            </Href>
            {description && (
                <>
                    <p
                        ref={descriptionRef}
                        className={clsx('m-0 color-weak w-full text-sm', !expanded && 'source-clamp source-clamp-2')}
                    >
                        {description}
                    </p>
                    {(canExpand || expanded) && (
                        <button
                            type="button"
                            className="source-link-toggle text-sm text-bold color-weak unstyled"
                            onClick={() => setExpanded((prev) => !prev)}
                        >
                            {expanded
                                ? c('collider_2025: Web Search').t`Show less`
                                : c('collider_2025: Web Search').t`Show more`}
                        </button>
                    )}
                </>
            )}
        </div>
    );
};

export default SourceLink;
