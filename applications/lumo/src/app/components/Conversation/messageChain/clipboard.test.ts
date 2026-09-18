import { prepareElementForCopy, prepareSelectedContentForCopy } from './clipboard';

describe('clipboard preparation', () => {
    it('uses semantic code-block markup in the clipboard clone without changing the rendered element', () => {
        const renderedElement = document.createElement('div');
        renderedElement.innerHTML = `
            <div class="lumo-syntax-highlighter" style="color: black">
                <code class="language-python"><span style="color: blue">first</span>
second</code>
            </div>
        `;

        const clipboardElement = prepareElementForCopy(renderedElement);
        const renderedHighlighter = renderedElement.querySelector('.lumo-syntax-highlighter');
        const clipboardHighlighter = clipboardElement.querySelector('.lumo-syntax-highlighter');
        const clipboardCode = clipboardHighlighter?.querySelector('code');
        const clipboardToken = clipboardCode?.querySelector('span');

        expect(renderedHighlighter?.tagName).toBe('DIV');
        expect(clipboardHighlighter?.tagName).toBe('PRE');
        expect(clipboardCode?.textContent).toBe('first\nsecond');
        expect(clipboardCode?.style.whiteSpace).toBe('pre-wrap');
        expect(clipboardToken?.style.color).toBe('blue');
    });

    it('creates semantic clipboard HTML for a partial selection inside a code block', () => {
        const scope = document.createElement('div');
        scope.innerHTML =
            '<div class="lumo-syntax-highlighter"><code class="language-python">' +
            '<span style="color: blue">first</span>\n<span>second</span></code></div>';
        document.body.appendChild(scope);

        const tokens = scope.querySelectorAll('span');
        const range = document.createRange();
        range.setStart(tokens[0].firstChild!, 2);
        range.setEnd(tokens[1].firstChild!, 3);

        const selection = window.getSelection()!;
        selection.removeAllRanges();
        selection.addRange(range);

        const clipboardContent = prepareSelectedContentForCopy(selection, scope);

        expect(clipboardContent?.plainText).toBe('rst\nsec');
        expect(clipboardContent?.html).toContain('<pre class="lumo-syntax-highlighter"');
        expect(clipboardContent?.html).toContain('<code class="language-python"');
        expect(clipboardContent?.html).toContain('<span style="color: blue">rst</span>\n<span>sec</span>');
        expect(clipboardContent?.html).not.toContain('<div class="lumo-syntax-highlighter"');
        expect(scope.querySelector('.lumo-syntax-highlighter')?.tagName).toBe('DIV');

        selection.removeAllRanges();
        scope.remove();
    });

    it('leaves mixed selections to the browser', () => {
        const scope = document.createElement('div');
        scope.innerHTML = '<p>Before</p><div class="lumo-syntax-highlighter"><code><span>code</span></code></div>';
        document.body.appendChild(scope);

        const range = document.createRange();
        range.setStart(scope.querySelector('p')!.firstChild!, 0);
        range.setEnd(scope.querySelector('span')!.firstChild!, 4);

        const selection = window.getSelection()!;
        selection.removeAllRanges();
        selection.addRange(range);

        expect(prepareSelectedContentForCopy(selection, scope)).toBeNull();

        selection.removeAllRanges();
        scope.remove();
    });
});
