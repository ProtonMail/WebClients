import { findInputBoundingElement } from './input';

type LayoutProps = {
    rect?: Partial<DOMRect>;
    styles?: Partial<CSSStyleDeclaration>;
    offsetHeight?: number;
    offsetWidth?: number;
};

class DOMBuilder {
    private els = new WeakMap<Element, LayoutProps>();

    static DEFAULT_STYLES = {
        borderTopWidth: '0px',
        borderRightWidth: '0px',
        borderBottomWidth: '0px',
        borderLeftWidth: '0px',
        borderTopStyle: 'none',
        borderRightStyle: 'none',
        borderBottomStyle: 'none',
        borderLeftStyle: 'none',
        boxShadow: 'none',
        paddingTop: '0px',
        paddingBottom: '0px',
        paddingLeft: '0px',
        paddingRight: '0px',
        marginTop: '0px',
        marginBottom: '0px',
        marginLeft: '0px',
        marginRight: '0px',
        boxSizing: 'border-box',
        height: 'auto',
        width: 'auto',
    };

    createElement<T extends HTMLElement = HTMLElement>(tag: string, props: LayoutProps = { rect: {}, styles: {} }): T {
        const el = document.createElement(tag);

        const { rect = {} } = props;
        const left = rect.left ?? 0;
        const top = rect.top ?? 0;
        const width = rect.width ?? 100;
        const height = rect.height ?? 30;

        const computedRect = {
            x: rect.x ?? left,
            y: rect.y ?? top,
            width,
            height,
            left,
            top,
            right: rect.right ?? left + width,
            bottom: rect.bottom ?? top + height,
        };

        const mockProps = {
            rect: computedRect,
            styles: {
                borderTopWidth: '0px',
                borderRightWidth: '0px',
                borderBottomWidth: '0px',
                borderLeftWidth: '0px',
                borderTopStyle: 'none',
                borderRightStyle: 'none',
                borderBottomStyle: 'none',
                borderLeftStyle: 'none',
                boxShadow: 'none',
                paddingTop: '0px',
                paddingBottom: '0px',
                paddingLeft: '0px',
                paddingRight: '0px',
                marginTop: '0px',
                marginBottom: '0px',
                marginLeft: '0px',
                marginRight: '0px',
                ...props.styles,
            },
        };

        this.els.set(el, mockProps);
        Object.defineProperty(el, 'offsetHeight', { get: () => props.offsetHeight ?? computedRect.height });
        Object.defineProperty(el, 'offsetWidth', { get: () => props.offsetWidth ?? computedRect.width });

        return el as T;
    }

    createInput(props?: LayoutProps): HTMLInputElement {
        const input = this.createElement('input', props) as HTMLInputElement;
        input.type = 'text';
        return input;
    }

    setup() {
        const instance = this;

        Element.prototype.getBoundingClientRect = jest.fn(function (this: Element) {
            const mock = instance.els.get(this);
            return {
                x: mock?.rect?.x ?? 0,
                y: mock?.rect?.y ?? 0,
                width: mock?.rect?.width ?? 0,
                height: mock?.rect?.height ?? 0,
                top: mock?.rect?.top ?? 0,
                right: mock?.rect?.right ?? 0,
                bottom: mock?.rect?.bottom ?? 0,
                left: mock?.rect?.left ?? 0,
            } as DOMRect;
        });

        global.getComputedStyle = jest.fn((element: Element) => {
            const el = instance.els.get(element);
            const styles = { ...DOMBuilder.DEFAULT_STYLES, ...el?.styles };

            return {
                ...styles,
                getPropertyValue: jest.fn((property: string) => {
                    const camelCase = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
                    return styles[camelCase as keyof typeof styles] || styles[property as keyof typeof styles] || '';
                }),
            } as CSSStyleDeclaration;
        });
    }
}

let builder: DOMBuilder;

describe('findInputBoundingElement', () => {
    beforeEach(() => {
        builder = new DOMBuilder();
        builder.setup();
        document.body.innerHTML = '';
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe('input with border (Case 1)', () => {
        test('should return input when it has visible border', () => {
            const input = builder.createInput({
                rect: { width: 200, height: 30 },
                styles: { borderBottomWidth: '1px' },
            });

            document.body.appendChild(input);

            const result = findInputBoundingElement(input);
            expect(result).toBe(input);
        });

        test('should return input when it has any border side', () => {
            const input = builder.createInput({
                rect: { width: 200, height: 30 },
                styles: { borderTopWidth: '2px', borderTopStyle: 'solid' },
            });

            document.body.appendChild(input);

            const result = findInputBoundingElement(input);
            expect(result).toBe(input);
        });
    });

    describe('input in suitable label (Case 2)', () => {
        test('should return label when it wraps single input with adequate height', () => {
            const label = builder.createElement('label', { rect: { width: 220, height: 40 } });
            const input = builder.createInput({ rect: { width: 200, height: 30 } });

            label.appendChild(input);
            document.body.appendChild(label);

            const result = findInputBoundingElement(input);
            expect(result).toBe(label);
        });

        test('should not return label with text nodes', () => {
            const label = builder.createElement('label', { rect: { width: 220, height: 40 } });
            const input = builder.createInput({ rect: { width: 200, height: 30 } });

            label.appendChild(document.createTextNode('Username: '));
            label.appendChild(input);
            document.body.appendChild(label);

            const result = findInputBoundingElement(input);
            expect(result).toBe(input);
        });

        test('should not return label with multiple visible inputs', () => {
            const label = builder.createElement('label', { rect: { width: 220, height: 40 } });
            const input1 = builder.createInput({ rect: { width: 100, height: 30 } });
            const input2 = builder.createInput({ rect: { width: 100, height: 30 } });

            label.appendChild(input1);
            label.appendChild(input2);
            document.body.appendChild(label);

            const result = findInputBoundingElement(input1);
            expect(result).toBe(input1);
        });

        test('should return label even with hidden inputs', () => {
            const label = builder.createElement('label', { rect: { width: 220, height: 40 } });
            const input = builder.createInput({ rect: { width: 200, height: 30 } });

            const hiddenInput = builder.createElement<HTMLInputElement>('input', { rect: { width: 0, height: 0 } });
            hiddenInput.type = 'hidden';

            label.appendChild(input);
            label.appendChild(hiddenInput);
            document.body.appendChild(label);

            const result = findInputBoundingElement(input);
            expect(result).toBe(label);
        });
    });

    describe('bordered parent traversal', () => {
        test('should return bordered parent with box shadow', () => {
            const input = builder.createInput({ rect: { width: 200, height: 30 } });
            const container = builder.createElement('div', {
                rect: { width: 220, height: 35 },
                styles: { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
            });

            container.appendChild(input);
            document.body.appendChild(container);

            const result = findInputBoundingElement(input);
            expect(result).toBe(container);
        });

        test('should return bordered parent with complete border', () => {
            const input = builder.createInput({ rect: { width: 200, height: 30 } });
            const container = builder.createElement('div', {
                rect: { width: 220, height: 35 },
                styles: {
                    borderTopWidth: '1px',
                    borderRightWidth: '1px',
                    borderBottomWidth: '1px',
                    borderLeftWidth: '1px',
                    borderTopStyle: 'solid',
                    borderRightStyle: 'solid',
                    borderBottomStyle: 'solid',
                    borderLeftStyle: 'solid',
                },
            });

            container.appendChild(input);
            document.body.appendChild(container);

            const result = findInputBoundingElement(input);
            expect(result).toBe(container);
        });

        test('should prefer complete border over incomplete border parent', () => {
            /** Outer container with complete border */
            const outerContainer = builder.createElement('div', {
                rect: { width: 240, height: 42 },
                styles: {
                    borderTopWidth: '1px',
                    borderRightWidth: '1px',
                    borderBottomWidth: '1px',
                    borderLeftWidth: '1px',
                    borderTopStyle: 'solid',
                    borderRightStyle: 'solid',
                    borderBottomStyle: 'solid',
                    borderLeftStyle: 'solid',
                },
            });

            /** Inner container with incomplete border (should be skipped) */
            const innerContainer = builder.createElement('div', {
                rect: { width: 220, height: 40 },
                styles: {
                    borderTopWidth: '1px',
                    borderRightWidth: '0px',
                    borderBottomWidth: '1px',
                    borderLeftWidth: '1px',
                    borderTopStyle: 'solid',
                    borderRightStyle: 'none',
                    borderBottomStyle: 'solid',
                    borderLeftStyle: 'solid',
                },
            });

            const input = builder.createInput({ rect: { width: 200, height: 30 } });

            innerContainer.appendChild(input);
            outerContainer.appendChild(innerContainer);
            document.body.appendChild(outerContainer);

            const result = findInputBoundingElement(input);
            expect(result).toBe(outerContainer);
        });
    });

    describe('single child traversal', () => {
        test('should traverse up when parent has single child', () => {
            const outer = builder.createElement('div', {
                rect: { width: 240, height: 40 },
                styles: {
                    borderTopWidth: '1px',
                    borderBottomWidth: '1px',
                    borderLeftWidth: '1px',
                    borderRightWidth: '1px',
                    borderTopStyle: 'solid',
                    borderBottomStyle: 'solid',
                    borderLeftStyle: 'solid',
                    borderRightStyle: 'solid',
                },
            });

            const inner = builder.createElement('div', { rect: { width: 220, height: 35 } });
            const input = builder.createInput({ rect: { width: 200, height: 30 } });

            inner.appendChild(input);
            outer.appendChild(inner);
            document.body.appendChild(outer);

            const result = findInputBoundingElement(input);
            expect(result).toBe(outer);
        });

        test('should stop traversal when reaching body', () => {
            const input = builder.createInput({ rect: { width: 200, height: 30 } });
            document.body.appendChild(input);

            const result = findInputBoundingElement(input);
            expect(result).toBe(input);
        });
    });

    describe('overlapping children logic', () => {
        test('should traverse when children overlap', () => {
            const outerDiv = builder.createElement('div', { rect: { width: 220, height: 40 } });
            const innerDiv = builder.createElement('div', { rect: { width: 220, height: 35 } });
            const input = builder.createInput({ rect: { width: 200, height: 30 } });

            // Both spans at same position - they overlap
            const span1 = builder.createElement('span', { rect: { width: 50, height: 30 } });
            const span2 = builder.createElement('span', { rect: { width: 50, height: 30 } });

            outerDiv.appendChild(span1);
            outerDiv.appendChild(span2);
            outerDiv.appendChild(innerDiv);
            innerDiv.appendChild(input);
            document.body.appendChild(outerDiv);

            const result = findInputBoundingElement(input);
            expect(result).toBe(outerDiv);
        });

        test('should stop when children do not overlap', () => {
            const outerDiv = builder.createElement('div', { rect: { width: 220, height: 40 } });
            const innerDiv = builder.createElement('div', { rect: { width: 220, height: 35 } });
            const input = builder.createInput({ rect: { width: 200, height: 30 } });

            // Spans positioned far apart - no overlap
            const span1 = builder.createElement('span', { rect: { width: 50, height: 30 } });
            const span2 = builder.createElement('span', { rect: { left: 100, width: 50, height: 30 } });

            outerDiv.appendChild(span1);
            outerDiv.appendChild(span2);
            outerDiv.appendChild(innerDiv);
            innerDiv.appendChild(input);
            document.body.appendChild(outerDiv);

            const result = findInputBoundingElement(input);
            expect(result).toBe(innerDiv);
        });
    });

    describe('parent constraint violations', () => {
        test('should stop at parent with excessive width', () => {
            const parent = builder.createElement('div', { rect: { width: 1000, height: 35 } });
            const input = builder.createInput({ rect: { width: 200, height: 30 } });

            parent.appendChild(input);
            document.body.appendChild(parent);

            const result = findInputBoundingElement(input);
            expect(result).toBe(input);
        });

        test('should stop at parent with insufficient height', () => {
            const parent = builder.createElement('div', { rect: { width: 220, height: 10 } });
            const input = builder.createInput({ rect: { width: 200, height: 30 } });

            parent.appendChild(input);
            document.body.appendChild(parent);

            const result = findInputBoundingElement(input);
            expect(result).toBe(input);
        });

        test('should stop at invalid bounding tags', () => {
            const form = builder.createElement('form', { rect: { width: 220, height: 35 } });
            const input = builder.createInput({ rect: { width: 200, height: 30 } });

            form.appendChild(input);
            document.body.appendChild(form);

            const result = findInputBoundingElement(input);
            expect(result).toBe(input);
        });

        test('should stop at table elements', () => {
            const td = builder.createElement('td', { rect: { width: 220, height: 35 } });
            const input = builder.createInput({ rect: { width: 200, height: 30 } });

            td.appendChild(input);
            document.body.appendChild(td);

            const result = findInputBoundingElement(input);
            expect(result).toBe(input);
        });

        test('should stop at parent with text nodes', () => {
            const container = builder.createElement('div', { rect: { width: 220, height: 35 } });
            const input = builder.createInput({ rect: { width: 200, height: 30 } });

            container.appendChild(document.createTextNode('Label text'));
            container.appendChild(input);
            document.body.appendChild(container);

            const result = findInputBoundingElement(input);
            expect(result).toBe(input);
        });

        test('should stop at parent with alert elements', () => {
            const container = builder.createElement('div', { rect: { width: 220, height: 35 } });
            const input = builder.createInput({ rect: { width: 200, height: 30 } });
            const alert = builder.createElement('div');
            alert.setAttribute('role', 'alert');

            container.appendChild(input);
            container.appendChild(alert);
            document.body.appendChild(container);

            const result = findInputBoundingElement(input);
            expect(result).toBe(input);
        });

        test('should ignore whitespace-only text nodes', () => {
            const container = builder.createElement('div', { rect: { width: 220, height: 35 } });
            const input = builder.createInput({ rect: { width: 200, height: 30 } });

            container.appendChild(document.createTextNode('   \n\t  '));
            container.appendChild(input);
            document.body.appendChild(container);

            const result = findInputBoundingElement(input);
            expect(result).toBe(container);
        });
    });

    describe('element constraint violations', () => {
        test('should stop if excessive margins on input', () => {
            const container = builder.createElement('div', { rect: { width: 220, height: 40 } });

            const input = builder.createInput({
                rect: { width: 200, height: 30 },
                styles: { marginTop: '10px', marginBottom: '10px' },
            });

            container.appendChild(input);
            document.body.appendChild(container);

            const result = findInputBoundingElement(input);
            expect(result).toBe(input);
        });

        test('should stop if excessive margins on container', () => {
            const outerContainer = builder.createElement('div', { rect: { width: 210, height: 50 } });
            const innerContainer = builder.createElement('div', {
                rect: { width: 220, height: 40 },
                styles: { marginTop: '10px', marginBottom: '10px' },
            });

            const input = builder.createInput({ rect: { width: 200, height: 30 } });

            innerContainer.appendChild(input);
            outerContainer.appendChild(innerContainer);
            document.body.appendChild(outerContainer);

            const result = findInputBoundingElement(input);
            expect(result).toBe(innerContainer);
        });
    });

    describe('padding constraints', () => {
        test('should allow one level of padding but stop at second', () => {
            const styles = { paddingTop: '5px', paddingBottom: '5px' };
            const outer = builder.createElement('div', { rect: { width: 220, height: 40 }, styles });
            const inner = builder.createElement('div', { rect: { width: 220, height: 35 }, styles });
            const input = builder.createInput({ rect: { width: 200, height: 30 } });

            inner.appendChild(input);
            outer.appendChild(inner);
            document.body.appendChild(outer);

            const result = findInputBoundingElement(input);
            expect(result).toBe(inner);
        });

        test('should adjust constraints when input has padding', () => {
            /** Container height would normally be too small (25 < 30 input height)
             * But with input padding adjustment: minHeight = 30 - 10 = 20, so 20px passes */
            const container = builder.createElement('div', {
                rect: { width: 220, height: 20 },
                styles: {
                    borderTopWidth: '1px',
                    borderBottomWidth: '1px',
                    borderLeftWidth: '1px',
                    borderRightWidth: '1px',
                    borderTopStyle: 'solid',
                    borderBottomStyle: 'solid',
                    borderLeftStyle: 'solid',
                    borderRightStyle: 'solid',
                },
            });

            const input = builder.createInput({
                rect: { width: 200, height: 30 },
                styles: { paddingTop: '5px', paddingBottom: '5px' } /** 10px shift */,
            });

            container.appendChild(input);
            document.body.appendChild(container);

            const result = findInputBoundingElement(input);
            expect(result).toBe(container);
        });
    });

    describe('Safari rendering quirks', () => {
        test('should stop at parent with valid DOMRect but bad offsetHeight', () => {
            /** Simulate Safari quirk where getBoundingClientRect returns valid dimensions
             * but offsetHeight is 0 - this should cause isSuitableParent to return false */
            const parent = builder.createElement('div', {
                rect: { width: 200, height: 35 },
                offsetHeight: 0,
                styles: {
                    borderTopWidth: '1px',
                    borderBottomWidth: '1px',
                    borderLeftWidth: '1px',
                    borderRightWidth: '1px',
                    borderTopStyle: 'solid',
                    borderBottomStyle: 'solid',
                    borderLeftStyle: 'solid',
                    borderRightStyle: 'solid',
                },
            });
            const input = builder.createInput({ rect: { width: 200, height: 30 } });

            parent.appendChild(input);
            document.body.appendChild(parent);

            const result = findInputBoundingElement(input);
            expect(result).toBe(input);
        });
    });
});
