import type * as QuickAskModule from './desktop-quick-ask';
import type { DesktopQuickAskApi } from './desktop-quick-ask';

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');

function setBridge(api: DesktopQuickAskApi | undefined) {
    Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: { LumoQuickAsk: api },
    });
}

// A fresh module per test, so memoised takes don't leak between tests.
function load(): typeof QuickAskModule {
    let mod!: typeof QuickAskModule;
    jest.isolateModules(() => {
        mod = require('./desktop-quick-ask');
    });
    return mod;
}

afterAll(() => {
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
    else Reflect.deleteProperty(globalThis, 'window');
});

test('returns null without a desktop bridge', async () => {
    setBridge(undefined);
    await expect(load().takeDesktopQuickAsk('nonce')).resolves.toBeNull();
});

test('trades the nonce for the question', async () => {
    const take = jest.fn(async () => 'what is the weather?');
    setBridge({ take });
    await expect(load().takeDesktopQuickAsk('abc')).resolves.toBe('what is the weather?');
    expect(take).toHaveBeenCalledWith('abc');
});

test('asks the shell once per nonce and hands the same answer to every caller', async () => {
    // The shell answers once; a second native call would return null.
    const take = jest.fn().mockResolvedValueOnce('hello').mockResolvedValue(null);
    setBridge({ take });
    const { takeDesktopQuickAsk } = load();

    const first = takeDesktopQuickAsk('abc');
    const second = takeDesktopQuickAsk('abc');

    await expect(first).resolves.toBe('hello');
    await expect(second).resolves.toBe('hello');
    expect(take).toHaveBeenCalledTimes(1);
});

test('a different nonce asks the shell again', async () => {
    const take = jest.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('second');
    setBridge({ take });
    const { takeDesktopQuickAsk } = load();

    await expect(takeDesktopQuickAsk('one')).resolves.toBe('first');
    await expect(takeDesktopQuickAsk('two')).resolves.toBe('second');
});

test('a refused or failing take yields null', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    setBridge({ take: jest.fn().mockResolvedValueOnce(null).mockRejectedValueOnce(new Error('denied')) });
    const { takeDesktopQuickAsk } = load();

    await expect(takeDesktopQuickAsk('unknown')).resolves.toBeNull();
    await expect(takeDesktopQuickAsk('broken')).resolves.toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
});

test('a blank question yields null', async () => {
    setBridge({ take: jest.fn(async () => '   ') });
    await expect(load().takeDesktopQuickAsk('abc')).resolves.toBeNull();
});
