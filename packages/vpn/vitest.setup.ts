import '@testing-library/jest-dom';
import { vi } from 'vitest';

global.AnimationEvent = class AnimationEvent extends Event implements AnimationEvent {
    private _animationName: string;

    private _elapsedTime: number;

    private _pseudoElement: string;

    constructor(type: string, animationEventInitDict: AnimationEventInit = {}) {
        const { animationName = '', elapsedTime = 0, pseudoElement = '', ...eventInitDict } = animationEventInitDict;
        super(type, eventInitDict);

        this._animationName = animationName;
        this._elapsedTime = elapsedTime;
        this._pseudoElement = pseudoElement;
    }

    get animationName() {
        return this._animationName;
    }

    get elapsedTime() {
        return this._elapsedTime;
    }

    get pseudoElement() {
        return this._pseudoElement;
    }
};

vi.mock('@proton/shared/lib/i18n/dateFnLocales', () => ({
    __esModule: true,
    enUSLocale: { code: 'en-US' },
}));

Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

vi.mock('@proton/components/containers/vpn/flag', () => ({
    getFlagSvg: vi.fn().mockImplementation((it) => it),
}));

vi.mock('@proton/components/components/v2/phone/flagSvgs', () => ({
    getFlagSvg: vi.fn().mockImplementation((it) => it),
}));

vi.mock('@proton/components/containers/vpn/OpenVPNConfigurationSection/LoadIndicator', () => ({
    __esModule: true,
    default: () => null,
}));

vi.mock('@proton/components/containers/vpn/ProtonVPNCredentialsSection/ProtonVPNCredentialsSection', () => ({
    __esModule: true,
    default: () => null,
}));

vi.mock('@proton/components/containers/vpn/ProtonVPNResourcesSection/ProtonVPNResourcesSection', () => ({
    __esModule: true,
    default: () => null,
}));
