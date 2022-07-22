import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

const { getComputedStyle } = window;

window.getComputedStyle = (elt) => getComputedStyle(elt);
window.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));

configure({ testIdAttribute: 'data-test-id' });

// Silence JDOM warnings triggered by emoji-mart
HTMLCanvasElement.prototype.getContext = jest.fn();
