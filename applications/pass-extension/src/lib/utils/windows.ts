import browser from '@proton/pass/lib/globals/browser';
import noop from '@proton/utils/noop';

export const waitForWindowFocus = (timeout: number): Promise<boolean> => {
    let settle: (focused: boolean) => void = noop;
    const result = new Promise<boolean>((resolve) => (settle = resolve));

    const onFocusChanged = (windowId: number) => {
        if (windowId !== browser.windows.WINDOW_ID_NONE) settle(true);
    };

    const timer = setTimeout(() => settle(false), timeout);
    browser.windows.onFocusChanged.addListener(onFocusChanged);

    browser.windows
        .getLastFocused()
        .then(({ focused }) => focused && settle(true))
        .catch(noop);

    return result.finally(() => {
        clearTimeout(timer);
        browser.windows.onFocusChanged.removeListener(onFocusChanged);
    });
};
