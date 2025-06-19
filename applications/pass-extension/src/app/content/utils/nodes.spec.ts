import { isActiveElement, selectNodeFromPath } from './nodes';

describe('`selectNodeFromPath`', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    test('should select element with single selector', () => {
        document.body.innerHTML = '<div id="test">content</div>';

        const result = selectNodeFromPath(document, ['#test']);
        expect(result).toBeTruthy();
        expect(result?.id).toBe('test');
    });

    test('should handle nested elements without shadow roots', () => {
        document.body.innerHTML = `
            <div id="container">
                <span class="target">regular dom</span>
            </div>
        `;

        const result = selectNodeFromPath(document, ['#container', '.target']);
        expect(result).toBeTruthy();
        expect(result?.textContent).toBe('regular dom');
    });

    test('should traverse through shadow DOM', () => {
        const host = document.createElement('custom-element');
        const shadow = host.attachShadow({ mode: 'open' });

        shadow.innerHTML = '<div class="inner">shadow content</div>';
        document.body.appendChild(host);

        const result = selectNodeFromPath(document, ['custom-element', '.inner']);
        expect(result).toBeTruthy();
        expect(result?.textContent).toBe('shadow content');
    });

    test('should handle closed shadow root', () => {
        const host = document.createElement('custom-element');
        const shadow = host.attachShadow({ mode: 'closed' });

        shadow.innerHTML = '<div class="inner">shadow content</div>';
        document.body.appendChild(host);

        const result = selectNodeFromPath(document, ['custom-element', '.inner']);
        expect(result).toBeNull();
    });

    test('should handle nested shadow roots', () => {
        const host1 = document.createElement('custom-element');
        const host2 = document.createElement('nested-element');
        const shadow1 = host1.attachShadow({ mode: 'open' });
        const shadow2 = host2.attachShadow({ mode: 'open' });

        shadow2.innerHTML = '<span id="deep">deep content</span>';
        document.body.appendChild(host1);
        shadow1.appendChild(host2);

        const result = selectNodeFromPath(document, ['custom-element', 'nested-element', '#deep']);
        expect(result).toBeTruthy();
        expect(result?.textContent).toBe('deep content');
    });

    test('should return `null` when first element not found', () => {
        const result = selectNodeFromPath(document, ['#nonexistent']);
        expect(result).toBeNull();
    });

    test('should return `null` for empty selector path', () => {
        const result = selectNodeFromPath(document, []);
        expect(result).toBeNull();
    });

    test('should return `null` when shadow element not found', () => {
        const host = document.createElement('custom-element');
        const shadow = host.attachShadow({ mode: 'open' });

        document.body.appendChild(host);
        shadow.innerHTML = '<div class="inner">content</div>';

        const result = selectNodeFromPath(document, ['custom-element', '.nonexistent']);
        expect(result).toBeNull();
    });
});

describe('`isActiveElement`', () => {
    test('should detect active element in regular DOM', () => {
        document.body.innerHTML = '<input id="test-input" />';
        const input = document.getElementById('test-input') as HTMLInputElement;

        input.focus();
        expect(isActiveElement(input)).toBe(true);

        input.blur();
        expect(isActiveElement(input)).toBe(false);
    });

    test('should detect active element in shadow DOM', () => {
        const host = document.createElement('custom-element');
        const shadow = host.attachShadow({ mode: 'open' });
        shadow.innerHTML = '<input class="shadow-input" />';
        document.body.appendChild(host);

        const shadowInput = shadow.querySelector('.shadow-input') as HTMLInputElement;
        shadowInput.focus();

        expect(isActiveElement(shadowInput)).toBe(true);
    });

    test('should detect active element in nested shadow DOM', () => {
        const host1 = document.createElement('outer-element');
        const host2 = document.createElement('inner-element');
        const shadow1 = host1.attachShadow({ mode: 'open' });
        const shadow2 = host2.attachShadow({ mode: 'open' });

        shadow2.innerHTML = '<input id="nested-input" />';
        shadow1.appendChild(host2);
        document.body.appendChild(host1);

        const nestedInput = shadow2.querySelector('#nested-input') as HTMLInputElement;
        nestedInput.focus();

        expect(isActiveElement(nestedInput)).toBe(true);
    });

    test('should return false for undefined target', () => {
        expect(isActiveElement()).toBe(false);
        expect(isActiveElement(undefined)).toBe(false);
    });

    test('should return false for disconnected elements', () => {
        const disconnected = document.createElement('div');
        expect(isActiveElement(disconnected)).toBe(false);
    });
});
