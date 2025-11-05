import { InlinePortMessageType } from 'proton-pass-extension/app/content/services/inline/inline.messages';

import { DROPDOWN_FOCUS_TRAP_TIMEOUT, createDropdownFocusController } from './dropdown.focus';

describe('DropdownFocusController', () => {
    const iframe = {
        state: { visible: true },
        sendPortMessage: jest.fn(() => Promise.resolve()),
        registerMessageHandler: jest.fn(),
    };

    const fieldElement = document.createElement('input');
    const field = {
        element: fieldElement,
        preventAction: jest.fn(),
        interactivity: { unlock: jest.fn(), lock: jest.fn() },
    };

    const popoverEl = document.createElement('div');
    const popover = { root: { customElement: popoverEl } };
    const anchor = { current: null as any };

    popoverEl.tabIndex = -1; /** Make popover element focusable for testing purposes */
    fieldElement.tabIndex = 0;

    const createController = () => createDropdownFocusController({ iframe, popover, anchor } as any);

    const getHandler = (messageType: InlinePortMessageType) => {
        const { calls } = iframe.registerMessageHandler.mock;
        return calls.find(([type]) => type === messageType)?.[1];
    };

    const simulateFocusTrap = (maxRetries: number) => {
        const originalBlur = fieldElement.blur.bind(fieldElement);
        const blur = jest.spyOn(fieldElement, 'blur');

        let callCount = 0;
        blur.mockImplementation(() => {
            callCount++;
            if (callCount < maxRetries) setTimeout(() => fieldElement.focus(), 1);
            else originalBlur();
        });

        return async () => {
            try {
                /** 25ms matches `waitUntil` retry timeout  */
                for (let i = 0; i <= callCount; i++) {
                    await jest.advanceTimersByTimeAsync(25);
                }
            } finally {
                blur.mockRestore();
            }
        };
    };

    beforeEach(() => {
        jest.useFakeTimers();

        iframe.state.visible = true;
        jest.clearAllMocks();

        document.body.innerHTML = '';
        document.body.appendChild(fieldElement);
        document.body.appendChild(popoverEl);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('initialization', () => {
        test('should register message handlers', () => {
            createController();

            expect(iframe.registerMessageHandler).toHaveBeenCalledWith(
                InlinePortMessageType.DROPDOWN_FOCUS_REQUEST,
                expect.any(Function)
            );

            expect(iframe.registerMessageHandler).toHaveBeenCalledWith(
                InlinePortMessageType.DROPDOWN_FOCUSED,
                expect.any(Function)
            );
        });
    });

    describe('`DropdownFocusController::focused`', () => {
        test('should return true when popover element is active', () => {
            const controller = createController();
            popoverEl.focus();
            expect(controller.focused).toBe(true);
        });

        test('should return false when popover element is not active', () => {
            const controller = createController();
            fieldElement.focus();
            expect(controller.focused).toBe(false);
        });
    });

    describe('`DropdownFocusController::willFocus`', () => {
        test('should initially be false', () => {
            const controller = createController();
            expect(controller.willFocus).toBe(false);
        });

        test('should be true during focus trap timeout', () => {
            const controller = createController();
            const onFocused = getHandler(InlinePortMessageType.DROPDOWN_FOCUSED);

            onFocused?.();
            expect(controller.willFocus).toBe(true);

            jest.advanceTimersByTime(DROPDOWN_FOCUS_TRAP_TIMEOUT);
            expect(controller.willFocus).toBe(false);
        });
    });

    describe('`DropdownFocusController::disconnect`', () => {
        test('should clear `willFocus` state and timer', () => {
            const controller = createController();
            const onFocused = getHandler(InlinePortMessageType.DROPDOWN_FOCUSED);

            onFocused?.();
            expect(controller.willFocus).toBe(true);

            controller.disconnect();
            expect(controller.willFocus).toBe(false);
        });
    });

    describe('Focus request handling', () => {
        test('should handle field anchor focus request', async () => {
            anchor.current = { type: 'field', field: field };

            createController();

            const onRequest = getHandler(InlinePortMessageType.DROPDOWN_FOCUS_REQUEST);
            const req = onRequest?.();
            await jest.runAllTimersAsync();
            await req;

            expect(iframe.sendPortMessage).toHaveBeenCalledWith({ type: InlinePortMessageType.DROPDOWN_FOCUS });
        });

        test('should handle frame anchor focus request', async () => {
            anchor.current = { type: 'frame' };

            createController();

            const onRequest = getHandler(InlinePortMessageType.DROPDOWN_FOCUS_REQUEST);
            const req = onRequest?.();
            await jest.runAllTimersAsync();
            await req;

            expect(iframe.sendPortMessage).toHaveBeenCalledWith({ type: InlinePortMessageType.DROPDOWN_FOCUS });
        });

        test('should blur field when it is active element', async () => {
            anchor.current = { type: 'field', field: field };
            fieldElement.focus();
            const blur = jest.spyOn(fieldElement, 'blur');

            createController();

            const onRequest = getHandler(InlinePortMessageType.DROPDOWN_FOCUS_REQUEST);
            const req = onRequest?.();
            await jest.runAllTimersAsync();
            await req;

            expect(blur).toHaveBeenCalled();
            blur.mockRestore();
        });

        test('should blur document active element when field is not active', async () => {
            const btn = document.createElement('button');
            const blur = jest.spyOn(btn, 'blur');
            anchor.current = { type: 'field', field: field };

            createController();
            document.body.appendChild(btn);
            btn.focus();

            const onRequest = getHandler(InlinePortMessageType.DROPDOWN_FOCUS_REQUEST);
            const req = onRequest?.();
            await jest.runAllTimersAsync();
            await req;

            expect(blur).toHaveBeenCalled();
            blur.mockRestore();
        });

        test('should return early when iframe not visible', () => {
            iframe.state.visible = false;
            anchor.current = { type: 'field', field: field };
            const controller = createController();

            expect(controller.willFocus).toBe(false);
        });

        test('should not handle focus request when popover already focused', async () => {
            popoverEl.focus();
            createController();

            const onRequest = getHandler(InlinePortMessageType.DROPDOWN_FOCUS_REQUEST);
            const req = onRequest?.();
            await jest.runAllTimersAsync();
            await req;

            expect(iframe.sendPortMessage).not.toHaveBeenCalled();
        });

        test('should handle focus trap with one re-focus attempt', async () => {
            anchor.current = { type: 'field', field: field };
            fieldElement.focus();
            const run = simulateFocusTrap(1);
            const ctrl = createController();

            const onRequest = getHandler(InlinePortMessageType.DROPDOWN_FOCUS_REQUEST);
            const req = onRequest?.();

            await run();
            await req;
            expect(iframe.sendPortMessage).toHaveBeenCalledWith({ type: InlinePortMessageType.DROPDOWN_FOCUS });
            expect(ctrl.willFocus).toBe(true);
        });

        test('should disconnect when focus trap persists for entire grace period', async () => {
            anchor.current = { type: 'field', field: field };
            fieldElement.focus();
            const run = simulateFocusTrap(DROPDOWN_FOCUS_TRAP_TIMEOUT / 25);
            const ctrl = createController();

            const onRequest = getHandler(InlinePortMessageType.DROPDOWN_FOCUS_REQUEST);
            const req = onRequest?.();

            await run();
            await req;

            expect(iframe.sendPortMessage).not.toHaveBeenCalled();
            expect(ctrl.willFocus).toBe(false);
        });
    });
});
