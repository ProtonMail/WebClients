import '@testing-library/jest-dom';

import '@proton/testing/lib/mockFlagSvg';
import '@proton/testing/lib/mockMatchMedia';
import '@proton/testing/lib/mockUnleash';

window.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));

HTMLCanvasElement.prototype.getContext = jest.fn();
window.SVGElement.prototype.getBBox = jest.fn().mockReturnValue({ width: 0 });
