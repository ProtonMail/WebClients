import React, { useLayoutEffect, useRef, useState } from 'react';

import DOMPurify from 'dompurify';
import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import clsx from '@proton/utils/clsx';

import type { SearchItem } from '../../lib/toolCall/types';
import { SourceFavIcon } from '../Conversation/messageChain/message/toolCall/SourcesBlock';
import { getDomain } from '../Conversation/messageChain/message/toolCall/helpers';

import './SourceLink.scss';

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
        <div className="source-link flex flex-column flex-nowrap gap-2 w-full p-2 radius-8 lumo-color-glyph">
            <Href
                onClick={(e) => handleLinkClick(e, result.url)}
                className="source-link-target flex flex-column flex-nowrap gap-2 lumo-color-glyph"
            >
                <div className="flex flex-row flex-nowrap gap-2 items-center shrink-0">
                    <SourceFavIcon domain={domain} />
                    <span className="w-full lumo-label-small text-ellipsis lumo-color-glyph-mid">{domain}</span>
                </div>
                <p className="m-0 lumo-label-large source-clamp source-clamp-2 hover:text-underline">{result.title}</p>
            </Href>
            {description && (
                <>
                    <p
                        ref={descriptionRef}
                        className={clsx(
                            'w-full m-0 lumo-body-small lumo-color-glyph-mid',
                            !expanded && 'source-clamp source-clamp-2'
                        )}
                    >
                        {description}
                    </p>
                    {(canExpand || expanded) && (
                        <button
                            type="button"
                            className="source-link-toggle p-0 unstyled lumo-label-small lumo-color-glyph-mid"
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
