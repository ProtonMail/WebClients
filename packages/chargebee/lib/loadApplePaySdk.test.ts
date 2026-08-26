const getInjectedScripts = () =>
    Array.from(document.head.querySelectorAll('script')).filter((script) => script.src.includes('applepay.cdn-apple'));

const importFresh = async () => {
    jest.resetModules();
    return (await import('./loadApplePaySdk')).loadApplePaySdk;
};

describe('loadApplePaySdk', () => {
    afterEach(() => {
        delete (window as any).ApplePaySession;
        getInjectedScripts().forEach((script) => script.remove());
    });

    it('injects nothing in Safari, where ApplePaySession is native', async () => {
        (window as any).ApplePaySession = {};
        const loadApplePaySdk = await importFresh();

        await loadApplePaySdk();

        expect(getInjectedScripts()).toHaveLength(0);
    });

    it('injects the script once for concurrent callers', async () => {
        const loadApplePaySdk = await importFresh();

        const loads = Promise.all([loadApplePaySdk(), loadApplePaySdk()]);
        const scripts = getInjectedScripts();
        scripts.forEach((script) => script.dispatchEvent(new Event('load')));

        await loads;
        expect(scripts).toHaveLength(1);
    });

    it('resolves when the script fails to load', async () => {
        const loadApplePaySdk = await importFresh();

        const load = loadApplePaySdk();
        getInjectedScripts().forEach((script) => script.dispatchEvent(new Event('error')));

        await expect(load).resolves.toBeUndefined();
    });

    it('injects nothing more once the script defined ApplePaySession', async () => {
        const loadApplePaySdk = await importFresh();

        const load = loadApplePaySdk();
        (window as any).ApplePaySession = {};
        getInjectedScripts().forEach((script) => script.dispatchEvent(new Event('load')));
        await load;

        await loadApplePaySdk();

        expect(getInjectedScripts()).toHaveLength(1);
    });

    it('resolves when the script neither loads nor errors', async () => {
        jest.useFakeTimers();
        const loadApplePaySdk = await importFresh();

        const load = loadApplePaySdk();
        jest.runAllTimers();

        await expect(load).resolves.toBeUndefined();
        jest.useRealTimers();
    });
});
