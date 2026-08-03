import markdownit from 'markdown-it';

export const SIGNATURE_PLACEHOLDER = '--protonSignature--';

const OPTIONS = {
    breaks: true,
    linkify: true,
};

export const DEFAULT_TAGS_TO_DISABLE = ['lheading', 'heading', 'list', 'code', 'fence', 'hr'];

export const getMarkdownParser = (tagsToDisable = DEFAULT_TAGS_TO_DISABLE) => {
    return markdownit('default', OPTIONS).disable([...tagsToDisable]);
};

export const escapeBackslash = (text = '') => text.replace(/\\/g, '\\\\');

export const extractContentFromPtag = (content: string) => {
    if (!content.startsWith('<p>') || !content.endsWith('</p>')) {
        return undefined;
    }

    const inner = content.slice(3, -4);

    if (inner.includes('<p>')) {
        return undefined;
    }

    return inner;
};
