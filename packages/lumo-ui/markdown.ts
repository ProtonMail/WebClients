import markdownit from 'markdown-it';

/**
 * Renders a Lumo reply (short, model-authored markdown) to HTML for a chat bubble. markdown-it keeps
 * its default `html: false`, so any raw HTML in the model output is escaped rather than injected, and
 * its default `validateLink` blocks `javascript:`/`vbscript:`/`data:` URLs — the same safe posture the
 * Mail app relies on in `textToHtml`. `breaks` turns single newlines into `<br>` and `linkify` makes
 * bare URLs clickable, both of which match how a chat reply reads.
 */
const parser = markdownit({ breaks: true, linkify: true });

export const renderReplyMarkdown = (text: string): string => parser.render(text);
