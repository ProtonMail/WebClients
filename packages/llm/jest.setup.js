import '@testing-library/jest-dom';

import '@proton/components/testing/mockFlagSvg';
import '@proton/components/testing/mockMatchMedia';
import '@proton/unleash/testing/mockUnleash';

window.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));

HTMLCanvasElement.prototype.getContext = jest.fn();
window.SVGElement.prototype.getBBox = jest.fn().mockReturnValue({ width: 0 });
