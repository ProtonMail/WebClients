import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';

import '@proton/components/testing/vitest/mockFlagSvg';
import '@proton/components/testing/vitest/mockMatchMedia';
import '@proton/unleash/testing/vitest/mockUnleash';

afterEach(cleanup);

window.ResizeObserver = class {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
} as unknown as typeof ResizeObserver;

HTMLCanvasElement.prototype.getContext = vi.fn() as any;
(window.SVGElement.prototype as any).getBBox = vi.fn().mockReturnValue({ width: 0 });
