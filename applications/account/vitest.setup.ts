import '@proton/vitest-config/setup';
import '@proton/app-context/testing/mockTelemetry';
import '@proton/components/testing/mockFlagSvg';
import '@proton/components/testing/mockMatchMedia';
import '@proton/unleash/testing/mockUnleash';

// Mock window.getComputedStyle to prevent "Not implemented" errors
const { getComputedStyle } = window;
window.getComputedStyle = (elt) => getComputedStyle(elt);

window.ResizeObserver = class {
    observe = vi.fn();

    unobserve = vi.fn();

    disconnect = vi.fn();
} as unknown as typeof ResizeObserver;

// Do not start crypto worker pool, let the single tests setup/mock the CryptoProxy as needed
vi.mock('@proton/shared/lib/helpers/setupCryptoWorker', () => ({
    __esModule: true,
    loadCryptoWorker: vi.fn(),
}));

// Mock locale to avoid dynamic imports and big text context
vi.mock('./src/app/locales.ts', () => ({
    __esModule: true,
    default: {},
}));
vi.mock('./src/app/public-app/localePrefix.ts', () => ({
    __esModule: true,
    stripLocaleTagPrefix: (pathname: string) => ({
        fullLocale: 'en',
        localePrefix: 'en',
        pathname: pathname.replace(/^\/\w{2,3}(-\w{2})?\//, '') || '/',
    }),
    // English has no path prefix, as in the app
    getLocaleMapping: (localeCode: string) => (localeCode === 'en_US' ? undefined : localeCode),
}));

(window.SVGElement.prototype as any).getBBox = vi.fn().mockReturnValue({ width: 0 });

// Some components use the metrics API; mock it so batched fetches don't fail tests randomly.
vi.mock('@proton/metrics/metricsInstance');

// Modals render a <dialog> shown by our CSS reset, which tests do not load.
const style = document.createElement('style');
style.textContent = 'dialog { display: block; }';
document.head.append(style);

// AnimationEvent polyfill so `animationend` events reach React
(globalThis as any).AnimationEvent ??= class AnimationEvent extends Event {
    animationName: string;

    elapsedTime: number;

    pseudoElement: string;

    constructor(
        type: string,
        { animationName = '', elapsedTime = 0, pseudoElement = '', ...init }: Record<string, any> = {}
    ) {
        super(type, init);
        this.animationName = animationName;
        this.elapsedTime = elapsedTime;
        this.pseudoElement = pseudoElement;
    }
};
