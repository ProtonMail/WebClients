import '@proton/unleash/testing/vitest/mockUnleash';
import '@proton/app-context/testing/vitest/mockTelemetry';

// Do not start crypto worker pool, let the single tests setup/mock the CryptoProxy as needed
vi.mock('@proton/shared/lib/helpers/setupCryptoWorker', () => ({
    __esModule: true,
    loadCryptoWorker: vi.fn(),
}));

// Some components use the metrics API. If we don't mock it, tests might fail in a seemingly random manner.
// The metrics package has its own test coverage, so we don't need to test it here.
vi.mock('@proton/metrics/metricsInstance');

if (typeof document !== 'undefined') {
    // No @testing-library/react here: it registers its own afterEach(cleanup) with globals on, and loading it
    // in every file (including those that never render) costs ~75 ms each.
    await Promise.all([
        import('@testing-library/jest-dom/vitest'),
        // @ts-expect-error side-effect-only module without exports
        import('@proton/components/testing/vitest/mockMatchMedia'),
        import('@proton/components/testing/vitest/mockFlagSvg'),
    ]);

    // A <dialog> without `open` is hidden and its content is inaccessible. Our CSS reset shows it, tests do not load it.
    const style = document.createElement('style');
    style.textContent = 'dialog { display: block; }';
    document.head.append(style);

    // Some hooks (useActiveBreakpoint...) compute styles
    const { getComputedStyle } = window;
    window.getComputedStyle = (elt) => getComputedStyle(elt);

    window.ResizeObserver = class {
        observe = vi.fn();

        unobserve = vi.fn();

        disconnect = vi.fn();
    } as unknown as typeof ResizeObserver;

    (window.SVGElement.prototype as any).getBBox = vi.fn().mockReturnValue({ width: 0 });
}
