import TurndownService from 'turndown';

import identity from '@proton/utils/identity';

const EMPTY_LINE_KEEPER = '%%%PROTON-EMPTY-LINE%%%';

/**
 * Transform HTML to text
 * Append lines before the content if it starts with a Signature
 */
export const toText = (html: string) => {
    const turndownService = new TurndownService({
        bulletListMarker: '-',
        strongDelimiter: '' as any,
        emDelimiter: '' as any,
        hr: '',
    });

    const replaceBreakLine = {
        filter: 'br',
        replacement(content: string, node: HTMLElement) {
            // ex <li>monique<br></li>
            if (node.parentElement?.lastChild === node && node.parentElement.textContent) {
                return node.parentElement.nodeName !== 'LI' ? '\n' : '';
            }

            // Turndown remove multiple empty lines by default
            // So we use special anchors on each line break to for keeping all lines
            return `${EMPTY_LINE_KEEPER}\n`;
        },
    } as TurndownService.Rule;

    const replaceImg = {
        filter: 'img',
        replacement() {
            // Remove all images from the text
            return '';
        },
    } as TurndownService.Rule;

    const replaceAnchor = {
        filter: 'a',
        replacement(content: string, node: HTMLElement) {
            return node.textContent;
        },
    } as TurndownService.Rule;

    const replaceDiv = {
        filter: ['div'],
        replacement(content: string, node: HTMLElement) {
            if (node.children.length > 0 && (node.lastChild?.nodeName === 'BR' || node.lastChild?.nodeName === 'DIV')) {
                return content;
            }

            return `${content}\n`;
        },
    } as TurndownService.Rule;

    const removeHiddenTags = {
        filter: (node: HTMLElement) => node.style.display === 'none' || node.style.visibility === 'hidden',
        replacement: () => '',
    } as TurndownService.Rule;

    turndownService.use([
        () => turndownService.addRule('replaceAnchor', replaceAnchor),
        () => turndownService.addRule('replaceDiv', replaceDiv),
        () => turndownService.addRule('replaceImg', replaceImg),
        () => turndownService.addRule('replaceBreakLine', replaceBreakLine),
        () => turndownService.addRule('removeHiddenTags', removeHiddenTags),
    ]);

    /**
     * Override turndown to NOT escape any HTML. For example MONO_TLS_PROVIDER -> MONO\_TLS\_PROVIDER.
     * Just return the value that is passed in.
     * Fixes https://github.com/ProtonMail/Angular/issues/6556
     */
    turndownService.escape = identity;

    let output = turndownService.turndown(html);

    // Remove anchors to meant to keep empty lines
    const emptyLineRegex = new RegExp(EMPTY_LINE_KEEPER, 'gi');
    output = output.replace(emptyLineRegex, '');

    return output;
};
