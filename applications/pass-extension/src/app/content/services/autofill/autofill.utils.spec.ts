import type { MockInstance } from 'vitest';

import { createAutofill, validateInputAutofill } from './autofill.utils';

const DTSetData = vi.fn();

global.DataTransfer = vi.fn().mockImplementation(function () {
    return { setData: DTSetData };
});
global.ClipboardEvent = vi.fn().mockImplementation(function (type, options) {
    return {
        type,
        bubbles: options?.bubbles || false,
        cancelable: options?.cancelable || false,
        clipboardData: options?.clipboardData,
    };
});

/** Autofilling waits for a blur that never comes here: let the timers run instead of sleeping */
const fill = async (
    autofill: ReturnType<typeof createAutofill>,
    ...args: Parameters<ReturnType<typeof createAutofill>>
) => {
    const filled = autofill(...args);
    await vi.runAllTimersAsync();
    return filled;
};

describe('Autofill utils', () => {
    let input: HTMLInputElement;
    let dispatchEvent: MockInstance;
    let inputClick: MockInstance;
    let inputFocus: MockInstance;
    let inputBlur: MockInstance;

    beforeEach(() => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
        vi.clearAllMocks();
        input = document.createElement('input');
        dispatchEvent = vi.spyOn(input, 'dispatchEvent').mockReturnValue(true);
        inputClick = vi.spyOn(input, 'click').mockImplementation(() => {});
        inputFocus = vi.spyOn(input, 'focus').mockImplementation(() => {});
        inputBlur = vi.spyOn(input, 'blur').mockImplementation(() => {});
        Object.defineProperty(document, 'activeElement', { value: null, writable: true });
        Object.defineProperty(document, 'hasFocus', { value: () => true, writable: true });
    });

    afterEach(() => vi.useRealTimers());

    describe('Event sequence: unfocused input', () => {
        test('should dispatch events in correct order', async () => {
            const autofill = createAutofill(input);
            await fill(autofill, 'test-value');

            expect(inputClick).toHaveBeenCalled();
            expect(inputFocus).toHaveBeenCalled();
            expect(inputBlur).not.toHaveBeenCalled();

            const eventTypes = dispatchEvent.mock.calls.map((call) => call[0].type);
            expect(eventTypes).toEqual(['keydown', 'keypress', 'keyup', 'input', 'change', 'focusout', 'blur']);
        });
    });

    describe('Event sequence: focused input', () => {
        test('should dispatch events in correct order', async () => {
            Object.defineProperty(document, 'activeElement', { value: input, writable: true });

            const autofill = createAutofill(input);
            await fill(autofill, 'test-value');

            expect(inputClick).toHaveBeenCalled();
            expect(inputFocus).not.toHaveBeenCalled();
            expect(inputBlur).toHaveBeenCalled();

            const eventTypes = dispatchEvent.mock.calls.map((call) => call[0].type);
            expect(eventTypes).toEqual(['focusin', 'focus', 'keydown', 'keypress', 'keyup', 'input', 'change']);
        });
    });

    describe('Event sequence: paste mode', () => {
        test('should only dispatch paste event, no keyboard events', async () => {
            const autofill = createAutofill(input);
            await fill(autofill, 'paste-data', { paste: true });

            const eventTypes = dispatchEvent.mock.calls.map((call) => call[0].type);
            expect(eventTypes).toContain('paste');
            expect(eventTypes).not.toContain('keydown');
            expect(eventTypes).not.toContain('keypress');
            expect(eventTypes).not.toContain('keyup');
            expect(eventTypes).not.toContain('input');
            expect(eventTypes).not.toContain('change');
        });

        test('should set clipboard data correctly for paste event', async () => {
            const autofill = createAutofill(input);
            await fill(autofill, 'clipboard-content', { paste: true });

            expect(DTSetData).toHaveBeenCalledWith('text/plain', 'clipboard-content');

            const pasteEvent = dispatchEvent.mock.calls.find((call) => call[0].type === 'paste')?.[0];
            expect(pasteEvent.bubbles).toBe(true);
            expect(pasteEvent.cancelable).toBe(true);
        });
    });

    describe('Event bubbling', () => {
        test('should ensure all events bubble', async () => {
            const autofill = createAutofill(input);
            await fill(autofill, 'test');

            const events = dispatchEvent.mock.calls.map((call) => call[0]);
            events.forEach((event) => {
                if (event.constructor.name !== 'FocusEvent') {
                    expect(event.bubbles).toBe(true);
                }
            });
        });
    });

    describe('Error handling', () => {
        test('should never throw errors due to async sequence handling', async () => {
            dispatchEvent.mockImplementation(() => {
                throw new Error('Event dispatch failed');
            });

            const autofill = createAutofill(input);
            await expect(fill(autofill, 'test-value')).resolves.toBeUndefined();
            await expect(fill(autofill, 'paste-data', { paste: true })).resolves.toBeUndefined();
        });
    });

    describe('Input autofill validation', () => {
        test('Should block non-numeric values being autofilled on type="number"', () => {
            const input = document.createElement('input');
            input.type = 'number';

            expect(validateInputAutofill(input, 'abc')).toBe(false);
            expect(validateInputAutofill(input, 'abc3')).toBe(false);
            expect(validateInputAutofill(input, '')).toBe(true);
            expect(validateInputAutofill(input, '123')).toBe(true);
            expect(validateInputAutofill(input, '123.45')).toBe(true);
            expect(validateInputAutofill(input, '-10')).toBe(true);
            expect(validateInputAutofill(input, '!@#$%')).toBe(false);
            expect(validateInputAutofill(input, 'user@domain.com')).toBe(false);
            expect(validateInputAutofill(input, 'パスワード')).toBe(false);
            expect(validateInputAutofill(input, '用户名')).toBe(false);
            expect(validateInputAutofill(input, 'Пароль123')).toBe(false);
            expect(validateInputAutofill(input, '🔒password')).toBe(false);
        });

        test.each([['text'], ['password'], ['email'], ['tel']])(
            'Should allow all values for type="%s" inputs',
            (inputType) => {
                const input = document.createElement('input');
                input.type = inputType;

                expect(validateInputAutofill(input, 'abc')).toBe(true);
                expect(validateInputAutofill(input, '123')).toBe(true);
                expect(validateInputAutofill(input, '')).toBe(true);
                expect(validateInputAutofill(input, '!@#$%')).toBe(true);
                expect(validateInputAutofill(input, 'パスワード')).toBe(true);
                expect(validateInputAutofill(input, '用户名')).toBe(true);
                expect(validateInputAutofill(input, '🔒password')).toBe(true);
            }
        );
    });
});
