/**
 * HTML to Markdown converter utility
 * Uses turndown library to convert HTML back to markdown
 */
import TurndownService from 'turndown';

// Initialize turndown with desired options
const turndownService = new TurndownService({
    headingStyle: 'atx', // Use # for headings
    hr: '---', // Horizontal rules
    bulletListMarker: '-', // Use - for lists
    codeBlockStyle: 'fenced', // Use ``` for code blocks
    fence: '```', // Code fence marker
    emDelimiter: '_', // Use _ for emphasis
    strongDelimiter: '**', // Use ** for strong
    linkStyle: 'inlined', // Use [text](url) format
});

/**
 * Convert HTML to Markdown
 * @param html - The HTML string to convert
 * @returns Markdown string
 */
export function htmlToMarkdown(html: string): string {
    try {
        return turndownService.turndown(html);
    } catch (error) {
        console.error('Error converting HTML to markdown:', error);
        // Fallback to plain text extraction if conversion fails
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    }
}
