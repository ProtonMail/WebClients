const CLIPBOARD_CODE_FONT_FAMILY = "'SF Mono', Menlo, Monaco, Consolas, 'Liberation Mono', monospace";

const applyClipboardCodeStyles = (element: HTMLElement) => {
    element.style.whiteSpace = 'pre-wrap';
    element.style.fontFamily = CLIPBOARD_CODE_FONT_FAMILY;
};

const convertSyntaxHighlightersToPre = (element: HTMLElement) => {
    element.querySelectorAll<HTMLDivElement>('div.lumo-syntax-highlighter').forEach((highlighter) => {
        const pre = highlighter.ownerDocument.createElement('pre');

        Array.from(highlighter.attributes).forEach(({ name, value }) => pre.setAttribute(name, value));
        while (highlighter.firstChild) {
            pre.appendChild(highlighter.firstChild);
        }
        highlighter.replaceWith(pre);
    });
};

export const prepareElementForCopy = (element: HTMLDivElement): HTMLDivElement => {
    const clonedElement = element.cloneNode(true) as HTMLDivElement;

    clonedElement.querySelectorAll('.lumo-no-copy').forEach((item) => item.remove());

    clonedElement.style.backgroundColor = 'white';
    clonedElement.style.color = 'black';

    const applyLightTheme = (item: HTMLElement) => {
        if (item.tagName === 'CODE' || item.tagName === 'PRE') {
            // Clipboard HTML does not include Lumo's stylesheet. Do not recurse because Prism
            // token colors live on child <span> elements.
            applyClipboardCodeStyles(item);
            return;
        }

        if (item.classList.contains('lumo-syntax-highlighter')) {
            applyClipboardCodeStyles(item);
        }

        item.style.backgroundColor = 'white';
        item.style.color = 'black';

        Array.from(item.children).forEach((child) => {
            if (child instanceof HTMLElement) {
                applyLightTheme(child);
            }
        });
    };

    applyLightTheme(clonedElement);
    // The live highlighter uses a <div> for layout. Only the detached clipboard clone is changed
    // to semantic code-block markup recognized by rich-text editors.
    convertSyntaxHighlightersToPre(clonedElement);
    return clonedElement;
};

const getClosestElement = (node: Node): Element | null => {
    return node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
};

const wrapPartialCodeSelection = (range: Range, highlighter: HTMLElement): HTMLDivElement => {
    const container = highlighter.ownerDocument.createElement('div');
    const fragment = range.cloneContents();

    if (fragment.querySelector('.lumo-syntax-highlighter')) {
        container.appendChild(fragment);
        return container;
    }

    const highlighterClone = highlighter.cloneNode(false) as HTMLElement;
    if (fragment.querySelector('code')) {
        highlighterClone.appendChild(fragment);
    } else {
        const sourceCode = getClosestElement(range.startContainer)?.closest('code');
        const codeClone = sourceCode?.cloneNode(false) ?? highlighter.ownerDocument.createElement('code');
        codeClone.appendChild(fragment);
        highlighterClone.appendChild(codeClone);
    }
    container.appendChild(highlighterClone);
    return container;
};

type SelectedClipboardContent = {
    html: string;
    plainText: string;
};

export const prepareSelectedContentForCopy = (
    selection: Selection,
    scope: HTMLElement
): SelectedClipboardContent | null => {
    if (selection.isCollapsed || selection.rangeCount !== 1) {
        return null;
    }

    const range = selection.getRangeAt(0);
    if (!scope.contains(range.startContainer) || !scope.contains(range.endContainer)) {
        return null;
    }

    const startHighlighter = getClosestElement(range.startContainer)?.closest<HTMLElement>('.lumo-syntax-highlighter');
    const endHighlighter = getClosestElement(range.endContainer)?.closest<HTMLElement>('.lumo-syntax-highlighter');

    // A mixed selection can lose partially-selected HTML ancestors when cloned. Leave those
    // selections to the browser rather than replacing them with structurally incomplete markup.
    if (!startHighlighter || startHighlighter !== endHighlighter) {
        return null;
    }

    // cloneContents omits ancestors when both boundaries are inside the same code block.
    const container = wrapPartialCodeSelection(range, startHighlighter);
    const prepared = prepareElementForCopy(container);

    return {
        html: prepared.innerHTML,
        plainText: prepared.textContent ?? selection.toString(),
    };
};
