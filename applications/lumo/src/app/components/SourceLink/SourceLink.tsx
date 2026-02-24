import React from 'react';

import DOMPurify from 'dompurify';

import { Href } from '@proton/atoms/Href/Href';

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

const SourceLink = ({ result, handleLinkClick, ...props }: SourceLinkProps) => {
    const domain = getDomain(result);
    if (!domain) return;
    return (
        <Href
            {...props}
            onClick={(e) => handleLinkClick(e, result.url)}
            className="source-link color-norm rounded p-2 w-full flex"
        >
            <div className="flex flex-column flex-nowrap gap-2">
                <div className="flex flex-row flex-nowrap gap-2 items-center shrink-0">
                    <SourceFavIcon domain={domain} />
                    <span className="text-sm color-weak text-bold w-full text-ellipsis">{domain}</span>
                </div>
                <p className="text-bold clampped hover:text-underline">{result.title}</p>
                <p className="color-weak w-full text-sm clampped">{getStrippedHtml(result?.description ?? '')}</p>
            </div>
        </Href>
    );
};

export default SourceLink;
