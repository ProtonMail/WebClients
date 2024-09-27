import TurndownService from 'turndown';

import { removeLineBreaks } from 'proton-mail/helpers/string';
import {
    DEFAULT_TAGS_TO_DISABLE,
    extractContentFromPtag,
    prepareConversionToHTML,
} from 'proton-mail/helpers/textToHtml';

const turndownService = new TurndownService({
    bulletListMarker: '-', // Use '-' instead of '*'
    hr: '---', // Use '---' instead of '***'
    headingStyle: 'atx', // Use '#' for headings
});

turndownService.addRule('strikethrough', {
    filter: ['del', 's', 'strike' as any], // 'strike' is deprecated, however the editor insert strike tag
    replacement: function (content) {
        return `~~${content}~~`;
    },
});

export const cleanMarkdown = (markdown: string): string => {
    // Remove unnecessary spaces in unordered list but preserve indentation
    let result = markdown.replace(/(\n\s*)-\s*/g, '$1- ');
    // Remove unnecessary spaces in ordered list but preserve indentation
    result = result.replace(/(\n\s*)(\d+\.)\s*/g, '$1$2 ');
    // Remove unnecessary spaces in heading
    result = result.replace(/\n\s*#/g, '\n#');
    // Remove unnecessary spaces in code block
    result = result.replace(/\n\s*```\n/g, '\n```\n');
    // Remove unnecessary spaces in blockquote
    result = result.replace(/\n\s*>/g, '\n>');
    return result;
};

export const fixNestedLists = (dom: Document): Document => {
    // Query all improperly nested <ul> and <ol> elements
    const lists = dom.querySelectorAll('ul > ul, ul > ol, ol > ul, ol > ol');

    lists.forEach((list) => {
        const parent = list.parentElement;
        const previousSibling = list.previousElementSibling;

        // Ensure the parent exists and check for previous sibling
        if (parent) {
            // Check if the previous sibling is an <li> or create one if necessary
            if (!(previousSibling instanceof HTMLLIElement)) {
                const li = dom.createElement('li');
                parent.insertBefore(li, list);
                li.appendChild(list);
            } else {
                previousSibling.appendChild(list);
            }
        }
    });

    return dom;
};

export const htmlToMarkdown = (dom: Document): string => {
    const domFixed = fixNestedLists(dom);
    const markdown = turndownService.turndown(domFixed);
    const markdownCleaned = cleanMarkdown(markdown);
    return markdownCleaned;
};

// Using the same config and steps than what we do in textToHTML.
// This is formatting lists and other elements correctly, adding line separators etc...
export const markdownToHTML = (markdownContent: string, keepLineBreaks = false): string => {
    // We also want to convert list, so we need to remove it from the tags to disable
    const TAGS_TO_DISABLE = [...DEFAULT_TAGS_TO_DISABLE].filter((tag) => tag !== 'list');

    const html = prepareConversionToHTML(markdownContent, TAGS_TO_DISABLE);
    // Need to remove line breaks, we already have <br/> tag to separate lines
    const htmlCleaned = keepLineBreaks ? html : removeLineBreaks(html);
    /**
     * The capturing group includes negative lookup "(?!<p>)" in order to avoid nested problems.
     * Ex, this capture will be ignored : "<p>Hello</p><p>Hello again</p>""
     * Because it would have ended up with this result : "Hello</p><p>Hello again"
     */
    return extractContentFromPtag(htmlCleaned) || htmlCleaned;
};
