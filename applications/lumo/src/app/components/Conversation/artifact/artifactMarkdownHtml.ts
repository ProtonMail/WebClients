import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Markdown from 'react-markdown';

import remarkGfm from 'remark-gfm';

/** Convert artifact markdown content to an HTML fragment. */
export function markdownToHtmlBody(markdown: string): string {
    return renderToStaticMarkup(
        createElement(Markdown, {
            remarkPlugins: [remarkGfm],
            children: markdown,
        })
    );
}
