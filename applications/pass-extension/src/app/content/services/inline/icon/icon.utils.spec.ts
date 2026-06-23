import type { MaybeNull } from '@proton/pass/types';

import { isInvisible, resolveInjectionAnchor, shouldCreateContainingBlock } from './icon.utils';

describe('resolveInjectionAnchor', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    test('should return input when no next sibling or sibling is not a label', () => {
        const input = document.createElement('input');
        const div = document.createElement('div');

        document.body.appendChild(input);
        expect(resolveInjectionAnchor(input)).toBe(input);

        document.body.appendChild(div);
        expect(resolveInjectionAnchor(input)).toBe(input);
    });

    test('should return label when next sibling is a label (floating label pattern)', () => {
        const input = document.createElement('input');
        const label = document.createElement('label');

        document.body.appendChild(input);
        document.body.appendChild(label);

        expect(resolveInjectionAnchor(input)).toBe(label);
    });
});

describe('shouldCreateStackingContext', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    test('should return false when scroll parent is document.body', () => {
        document.body.innerHTML = `
            <form id="form">
                <div id="target"></div>
            </form>
        `;

        const form = document.getElementById('form')!;
        const target = document.getElementById('target')!;

        expect(shouldCreateContainingBlock(target, form, document.body)).toBe(false);
    });

    test('should return false when existing containing block found', () => {
        document.body.innerHTML = `
            <div id="scrollParent">
                <form id="form">
                    <div id="containingParent" style="position: relative;">
                        <div id="target"></div>
                    </div>
                </form>
            </div>
        `;

        const form = document.getElementById('form')!;
        const target = document.getElementById('target')!;
        const scrollParent = document.getElementById('scrollParent')!;

        expect(shouldCreateContainingBlock(target, form, scrollParent)).toBe(false);
    });

    test('should return true when reaching form boundary without containing block', () => {
        document.body.innerHTML = `
            <div id="scrollParent" style="overflow-y: scroll;">
                <form id="form">
                    <div id="target"></div>
                </form>
            </div>
        `;

        const form = document.getElementById('form')!;
        const target = document.getElementById('target')!;
        const scrollParent = document.getElementById('scrollParent')!;

        expect(shouldCreateContainingBlock(target, form, scrollParent)).toBe(true);
    });

    test('should return true when reaching scrollParent boundary without containing block', () => {
        document.body.innerHTML = `
            <div id="scrollParent" style="overflow-y: auto;">
                <form id="form">
                    <div id="wrapper">
                        <div id="target"></div>
                    </div>
                </form>
            </div>
        `;

        const form = document.getElementById('form')!;
        const target = document.getElementById('target')!;
        const scrollParent = document.getElementById('scrollParent')!;

        expect(shouldCreateContainingBlock(target, form, scrollParent)).toBe(true);
    });

    test('should return true when scrollParent is inside form without containing block', () => {
        document.body.innerHTML = `
            <form id="form">
                <div id="scrollParent" style="overflow-y: auto;">
                    <div id="wrapper">
                        <div id="target"></div>
                    </div>
                </div>
            </form>
        `;

        const form = document.getElementById('form')!;
        const target = document.getElementById('target')!;
        const scrollParent = document.getElementById('scrollParent')!;

        expect(shouldCreateContainingBlock(target, form, scrollParent)).toBe(true);
    });

    test('should return false when target itself creates containing block', () => {
        document.body.innerHTML = `
            <div id="scrollParent" style="overflow-y: scroll;">
                <form id="form">
                    <div id="target" style="position: relative;"></div>
                </form>
            </div>
        `;

        const form = document.getElementById('form')!;
        const target = document.getElementById('target')!;
        const scrollParent = document.getElementById('scrollParent')!;

        expect(shouldCreateContainingBlock(target, form, scrollParent)).toBe(false);
    });

    test('should return false when parent has transform creating containing block', () => {
        document.body.innerHTML = `
            <div id="scrollParent" style="overflow-y: auto;">
                <form id="form">
                    <div id="transformParent" style="transform: translateX(0);">
                        <div id="target"></div>
                    </div>
                </form>
            </div>
        `;

        const form = document.getElementById('form')!;
        const target = document.getElementById('target')!;
        const scrollParent = document.getElementById('scrollParent')!;

        expect(shouldCreateContainingBlock(target, form, scrollParent)).toBe(false);
    });
});

describe('isInvisible', () => {
    /** JSDOM can't resolve `getComputedStyle(el, '::before')` and reports
     * an unset `background-image` as '' rather than the 'none'. */
    const pseudos: Map<HTMLElement, { before?: string; after?: string }> = new Map();
    const getComputedStyle = window.getComputedStyle.bind(window);

    beforeEach(() => {
        document.body.innerHTML = '';
        pseudos.clear();

        jest.spyOn(window, 'getComputedStyle').mockImplementation((el: Element, pseudo?: MaybeNull<string>) => {
            if (pseudo === '::before' || pseudo === '::after') {
                const key = pseudo === '::before' ? 'before' : 'after';
                return { content: pseudos.get(el as HTMLElement)?.[key] ?? 'none' } as CSSStyleDeclaration;
            }

            const styles = getComputedStyle(el);
            return {
                display: styles.display,
                visibility: styles.visibility,
                opacity: styles.opacity,
                backgroundColor: styles.backgroundColor,
                backgroundImage: styles.backgroundImage || 'none',
            } as CSSStyleDeclaration;
        });
    });

    afterEach(() => jest.restoreAllMocks());

    const render = (html: string): HTMLElement => {
        document.body.innerHTML = html;
        return document.getElementById('el')!;
    };

    test('should treat `display: none` as invisible', () => {
        expect(isInvisible(render(`<div id="el" style="display: none;"></div>`))).toBe(true);
    });

    test('should treat `visibility: hidden` as invisible', () => {
        expect(isInvisible(render(`<div id="el" style="visibility: hidden;"></div>`))).toBe(true);
    });

    test('should treat `opacity: 0` as invisible', () => {
        expect(isInvisible(render(`<div id="el" style="opacity: 0;"></div>`))).toBe(true);
    });

    test('should treat an empty transparent div as invisible', () => {
        expect(isInvisible(render(`<div id="el"></div>`))).toBe(true);
    });

    test('should treat an empty transparent span as invisible', () => {
        expect(isInvisible(render(`<span id="el"></span>`))).toBe(true);
    });

    test('should not treat a div with a background color as invisible', () => {
        expect(isInvisible(render(`<div id="el" style="background-color: rgb(1, 2, 3);"></div>`))).toBe(false);
    });

    test('should not treat a div with a background image as invisible', () => {
        expect(isInvisible(render(`<div id="el" style="background-image: url(x.png);"></div>`))).toBe(false);
    });

    test('should not treat a div with text content as invisible', () => {
        expect(isInvisible(render(`<div id="el">hello</div>`))).toBe(false);
    });

    test('should not treat a div with child elements as invisible', () => {
        expect(isInvisible(render(`<div id="el"><span>child</span></div>`))).toBe(false);
    });

    test('should not treat a div with `::before` pseudo content as invisible', () => {
        const el = render(`<div id="el"></div>`);
        pseudos.set(el, { before: '_' });
        expect(isInvisible(el)).toBe(false);
    });

    test('should not treat a div with `::after` pseudo content as invisible', () => {
        const el = render(`<div id="el"></div>`);
        pseudos.set(el, { after: '_' });
        expect(isInvisible(el)).toBe(false);
    });

    test('should not treat an empty transparent `<i>` as invisible', () => {
        expect(isInvisible(render(`<i id="el"></i>`))).toBe(false);
    });
});
