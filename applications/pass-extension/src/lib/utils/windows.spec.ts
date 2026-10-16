import browser from '../../__mocks__/webextension-polyfill';
import { waitForWindowFocus } from './windows';

const { getLastFocused, onFocusChanged } = browser.windows;
const emitFocusChanged = (windowId: number) => onFocusChanged.addListener.mock.calls[0][0](windowId);

describe('waitForWindowFocus', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        getLastFocused.mockResolvedValue({ focused: false });
        onFocusChanged.addListener.mockClear();
        onFocusChanged.removeListener.mockClear();
    });

    afterEach(() => jest.useRealTimers());

    test('resolves `true` when the last focused window is already focused', async () => {
        getLastFocused.mockResolvedValue({ focused: true });
        await expect(waitForWindowFocus(2_000)).resolves.toBe(true);
        expect(onFocusChanged.removeListener).toHaveBeenCalledWith(onFocusChanged.addListener.mock.calls[0][0]);
    });

    test('resolves `true` once a window gains focus', async () => {
        const result = waitForWindowFocus(2_000);
        emitFocusChanged(42);
        await expect(result).resolves.toBe(true);
    });

    test('ignores focus leaving every window', async () => {
        const result = waitForWindowFocus(2_000);
        emitFocusChanged(browser.windows.WINDOW_ID_NONE);
        jest.advanceTimersByTime(2_000);
        await expect(result).resolves.toBe(false);
    });

    test('resolves `false` and stops listening after the timeout', async () => {
        const result = waitForWindowFocus(2_000);
        jest.advanceTimersByTime(2_000);
        await expect(result).resolves.toBe(false);
        expect(onFocusChanged.removeListener).toHaveBeenCalledWith(onFocusChanged.addListener.mock.calls[0][0]);
    });
});
