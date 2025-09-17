import { createAutofill } from './autofill';

const DTSetData = jest.fn();

global.DataTransfer = jest.fn().mockImplementation(() => ({ setData: DTSetData }));
global.ClipboardEvent = jest.fn().mockImplementation((type, options) => ({
    type,
    bubbles: options?.bubbles || false,
    cancelable: options?.cancelable || false,
    clipboardData: options?.clipboardData,
}));

describe('Autofill utils', () => {
    let input: HTMLInputElement;
    let dispatchEvent: jest.SpyInstance;
    let inputClick: jest.SpyInstance;
    let inputFocus: jest.SpyInstance;
    let inputBlur: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        input = document.createElement('input');
        dispatchEvent = jest.spyOn(input, 'dispatchEvent').mockReturnValue(true);
        inputClick = jest.spyOn(input, 'click').mockImplementation();
        inputFocus = jest.spyOn(input, 'focus').mockImplementation();
        inputBlur = jest.spyOn(input, 'blur').mockImplementation();
        Object.defineProperty(document, 'activeElement', { value: null, writable: true });
    });

    describe('Event sequence: unfocused input', () => {
        test('should dispatch events in correct order', async () => {
            const autofill = createAutofill(input);
            await autofill('test-value');

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
            await autofill('test-value');

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
            await autofill('paste-data', { paste: true });

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
            await autofill('clipboard-content', { paste: true });

            expect(DTSetData).toHaveBeenCalledWith('text/plain', 'clipboard-content');

            const pasteEvent = dispatchEvent.mock.calls.find((call) => call[0].type === 'paste')?.[0];
            expect(pasteEvent.bubbles).toBe(true);
            expect(pasteEvent.cancelable).toBe(true);
        });
    });

    describe('Event bubbling', () => {
        test('should ensure all events bubble', async () => {
            const autofill = createAutofill(input);
            await autofill('test');

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
            await expect(autofill('test-value')).resolves.toBeUndefined();
            await expect(autofill('paste-data', { paste: true })).resolves.toBeUndefined();
        });
    });
});
