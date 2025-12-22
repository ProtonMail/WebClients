import { resolveInjectionAnchor, shouldCreateContainingBlock } from './icon.utils';

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
